import { useMemo, useState, useEffect, useRef } from "react"
import { auth } from "@/src/extension/firebase"
import { onAuthStateChanged } from "firebase/auth"

import {
  Search,
  Clock3,
  StickyNote,
  Sparkles,
  LayoutGrid,
  Bookmark,
  Settings,
  ArrowUpRight,
  Star,
  History,
  Palette,
  Hash,
  FileCode,
  Braces,
  Variable,
  Shuffle,
  Languages,
  ArrowLeftRight,
  SearchCode,
  Pen,
  Scale,
  GitBranch,
  Lock,
  CheckSquare,
  Keyboard,
  ListChecks,
  Timer,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ExternalLink,
} from "lucide-react"
import { getExtensionRedirectUrl, openExtensionOptionsPage } from "@/src/extension/browserApi"

const toolRoutes: Record<string, string> = {
  "JSON Toolkit": "dev-space-json-toolkit.html",
  "Markdown Editor": "dev-space-markdown-editor.html",
  "Regex Workbench": "dev-space-regex-workbench.html",
  "Color Palette Generator": "dev-space-color-gen.html",
  "Random Picker": "dev-space-random-picker.html",
  "Language Learning": "dev-space-language-learning.html",
  "Code Translator": "dev-space-code-translator.html",
  "Code Explainer": "dev-space-code-explainer.html",
  "Writing Assistant": "dev-space-writing-assistant.html",
  "Prompt Synthesizer": "dev-space-prompt-synthesizer.html",
  "Decision Analyzer": "dev-space-decision-analyzer.html",
  "Git Reference": "dev-space-git-reference.html",
  "Crypto Utilities": "dev-space-crypto-utils.html",
  "Habit Tracker": "dev-space-habit-tracker.html",
  "Time & Date": "dev-space-time-date.html",
  "Focus Timer": "dev-space-focus-settings.html",
  "Bookmark Manager": "dev-space-bookmark-manager.html",
  "Shortcut Reference": "dev-space-shortcut-reference.html",
  "Notepad": "dev-space-notepad-panel.html",
  "Checklist Manager": "dev-space-checklist-manager.html",
}

const toolIcons: Record<string, any> = {
  "JSON Toolkit": Braces,
  "Markdown Editor": FileCode,
  "Regex Workbench": Hash,
  "Color Palette Generator": Palette,
  "Random Picker": Shuffle,
  "Language Learning": Languages,
  "Code Translator": ArrowLeftRight,
  "Code Explainer": SearchCode,
  "Writing Assistant": Pen,
  "Prompt Synthesizer": Sparkles,
  "Decision Analyzer": Scale,
  "Git Reference": GitBranch,
  "Crypto Utilities": Lock,
  "Habit Tracker": CheckSquare,
  "Time & Date": Clock3,
  "Focus Timer": Timer,
  "Bookmark Manager": Bookmark,
  "Shortcut Reference": Keyboard,
  "Notepad": StickyNote,
  "Checklist Manager": ListChecks,
}

const tools = Object.keys(toolRoutes)

function openTool(name: string) {
  const route = toolRoutes[name]
  if (route) {
    window.open(route, "_blank")
  }
}

function getRecent(): string[] {
  try {
    const stored = localStorage.getItem("popup_recent")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecent(name: string) {
  const recents = getRecent().filter(r => r !== name)
  recents.unshift(name)
  if (recents.length > 5) recents.length = 5
  localStorage.setItem("popup_recent", JSON.stringify(recents))
}

function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem("popup_favorites")
    return stored ? JSON.parse(stored) : ["JSON Toolkit", "Prompt Synthesizer", "Focus Timer"]
  } catch {
    return []
  }
}

function toggleFavorite(name: string) {
  const favs = getFavorites()
  const idx = favs.indexOf(name)
  if (idx >= 0) favs.splice(idx, 1)
  else favs.push(name)
  localStorage.setItem("popup_favorites", JSON.stringify(favs))
}

function handleOpenTool(name: string) {
  addRecent(name)
  openTool(name)
}

// ── Spotify/Music helpers ──

interface SpotifyTokens {
  access_token: string
  refresh_token?: string
  expires_at: number
}

interface TrackInfo {
  id: string
  name: string
  artists: string
  albumArt: string
  progress_ms: number
  duration_ms: number
}

function getSpotifyTokens(): SpotifyTokens | null {
  try { const raw = localStorage.getItem("spotify_tokens"); return raw ? JSON.parse(raw) : null }
  catch { return null }
}

function getSpotifyClientId(): string {
  return localStorage.getItem("spotify_client_id") || ""
}

async function refreshSpotifyToken(): Promise<string | null> {
  const tokens = getSpotifyTokens()
  const clientId = getSpotifyClientId()
  if (!tokens?.refresh_token || !clientId) return null
  try {
    const redirectUri = getExtensionRedirectUrl()
    if (!redirectUri) return null

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, grant_type: "refresh_token", refresh_token: tokens.refresh_token, redirect_uri: redirectUri })
    })
    const data = await res.json()
    if (!data.access_token) return null
    const updated = { ...tokens, access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 }
    localStorage.setItem("spotify_tokens", JSON.stringify(updated))
    return data.access_token
  } catch { return null }
}

async function getValidToken(): Promise<string | null> {
  const tokens = getSpotifyTokens()
  if (!tokens?.access_token) return null
  if (tokens.expires_at > Date.now() + 60000) return tokens.access_token
  return await refreshSpotifyToken()
}

async function spotifyFetch(path: string, options?: RequestInit): Promise<Response | null> {
  const token = await getValidToken()
  if (!token) return null
  return fetch(`https://api.spotify.com/v1${path}`, { ...options, headers: { ...options?.headers, Authorization: `Bearer ${token}` } })
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000)
  const sec = Math.floor((ms % 60000) / 1000)
  return `${min}:${String(sec).padStart(2, "0")}`
}

export default function App() {
  const [query, setQuery] = useState("")
  const [favorites, setFavorites] = useState(getFavorites)
  const [recents, setRecents] = useState(getRecent)
  const [showFavStar, setShowFavStar] = useState<string | null>(null)

  // ── Music player state ──
  const [connected, setConnected] = useState(!!getSpotifyTokens()?.access_token)
  const [track, setTrack] = useState<TrackInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [emailConnected, setEmailConnected] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Listen to real-time Firebase Auth changes
    let unsubscribeAuth = () => {}
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          const isGoogle = user.providerData.some((p) => p.providerId === "google.com")
          setGoogleConnected(isGoogle)
          setEmailConnected(!isGoogle)
        } else {
          setGoogleConnected(false)
          setEmailConnected(false)
        }
      })
    } else {
      // Fallback: check localStorage for Spotify/Google mock presence if Firebase is not enabled
      const gTokens = (() => { try { return JSON.parse(localStorage.getItem("google_tokens") || "null") } catch { return null } })()
      const gProfile = (() => { try { return JSON.parse(localStorage.getItem("google_profile") || "null") } catch { return null } })()
      const session = (() => { try { return JSON.parse(localStorage.getItem("auth_session") || "null") } catch { return null } })()
      setGoogleConnected(!!gTokens?.access_token && !!gProfile)
      setEmailConnected(!!session?.email)
    }

    const tokens = getSpotifyTokens()
    setConnected(!!tokens?.access_token)
    if (!tokens?.access_token) {
      setTrack(null)
      setIsPlaying(false)
      return
    }

    async function fetchTrack() {
      const res = await spotifyFetch("/me/player/currently-playing")
      if (!res || !res.ok) { setTrack(null); setIsPlaying(false); return }
      const data = await res.json()
      if (!data?.item) { setTrack(null); setIsPlaying(false); return }
      setTrack({
        id: data.item.id,
        name: data.item.name,
        artists: data.item.artists?.map((a: { name: string }) => a.name).join(", ") || "Unknown",
        albumArt: data.item.album?.images?.[0]?.url || "",
        progress_ms: data.progress_ms || 0,
        duration_ms: data.item.duration_ms || 0,
      })
      setIsPlaying(data.is_playing)
    }

    fetchTrack()
    pollRef.current = setInterval(fetchTrack, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      unsubscribeAuth()
    }
  }, [])

  async function spotifyControl(action: "play" | "pause" | "next" | "previous") {
    const endpoints: Record<string, string> = {
      play: "/me/player/play",
      pause: "/me/player/pause",
      next: "/me/player/next",
      previous: "/me/player/previous",
    }
    const method = action === "play" || action === "pause" ? "PUT" : "POST"
    await spotifyFetch(endpoints[action], { method })
    if (action === "play") setIsPlaying(true)
    else if (action === "pause") setIsPlaying(false)

    // Refresh track data after control
    setTimeout(async () => {
      const res = await spotifyFetch("/me/player/currently-playing")
      if (res?.ok) {
        const data = await res.json()
        if (data?.item) {
          setTrack({
            id: data.item.id,
            name: data.item.name,
            artists: data.item.artists?.map((a: { name: string }) => a.name).join(", ") || "Unknown",
            albumArt: data.item.album?.images?.[0]?.url || "",
            progress_ms: data.progress_ms || 0,
            duration_ms: data.item.duration_ms || 0,
          })
          setIsPlaying(data.is_playing)
        }
      }
    }, 500)
  }

  const filteredTools = useMemo(() => {
    if (!query) return []
    return tools.filter((tool) =>
      tool.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  const showSearchResults = query.length > 0

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white font-sans flex flex-col">
      {/* ── Accounts Bar ── */}
      <div className="border-b border-white/10 shrink-0">
        {(googleConnected || emailConnected) && (
          <div className="px-3 py-1.5 flex items-center gap-3 text-[10px] text-zinc-500 border-b border-white/5">
            {googleConnected && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" /> Google</span>}
            {emailConnected && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Email</span>}
          </div>
        )}

        {connected && (
          <div className="px-3 py-2">
            {track ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                  {track.albumArt ? (
                    <img src={track.albumArt} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Music className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate leading-tight">{track.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate leading-tight">{track.artists}</div>
                  <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#1DB954] rounded-full transition-all" style={{ width: `${(track.progress_ms / track.duration_ms) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => spotifyControl("previous")} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                    <SkipBack className="w-3 h-3 text-zinc-300" />
                  </button>
                  <button onClick={() => spotifyControl(isPlaying ? "pause" : "play")} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                    {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
                  </button>
                  <button onClick={() => spotifyControl("next")} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                    <SkipForward className="w-3 h-3 text-zinc-300" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Music className="w-3.5 h-3.5" />
                  <span>Spotify connected — idle</span>
                </div>
                <span className="text-[10px] text-zinc-500">Open Spotify</span>
              </div>
            )}
          </div>
        )}
        {!connected && (
          <button
            onClick={() => window.open("index.html", "_blank")}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/[0.03] transition"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Music className="w-3.5 h-3.5" />
              <span>Connect accounts to play music</span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
        <div>
          <h1 className="text-sm font-semibold tracking-wide">PRISM SPACE</h1>
          <p className="text-xs text-zinc-400">Your Internet Workspace</p>
        </div>

        <button
          onClick={() => {
            void openExtensionOptionsPage()
          }}
          className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools or type a command..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#8AFF00]/40 focus:bg-white/[0.07]"
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <QuickAction icon={StickyNote} label="Notes" onClick={() => handleOpenTool("Notepad")} />
          <QuickAction icon={Timer} label="Focus" onClick={() => handleOpenTool("Focus Timer")} />
          <QuickAction icon={Sparkles} label="AI" onClick={() => handleOpenTool("Prompt Synthesizer")} />
          <QuickAction icon={Bookmark} label="Bookmarks" onClick={() => handleOpenTool("Bookmark Manager")} />
        </div>

        {showSearchResults ? (
          <>
            <SectionTitle title={`Search Results (${filteredTools.length})`} />
            {filteredTools.length > 0 ? (
              <div className="space-y-2 pb-3">
                {filteredTools.map((tool) => {
                  const Icon = toolIcons[tool] || LayoutGrid
                  const isFav = favorites.includes(tool)
                  return (
                    <button
                      key={tool}
                      onClick={() => handleOpenTool(tool)}
                      onMouseEnter={() => setShowFavStar(tool)}
                      onMouseLeave={() => setShowFavStar(null)}
                      className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:border-[#8AFF00]/30 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-xl bg-white/5 p-2 shrink-0">
                          <Icon className="h-4 w-4 text-zinc-300" />
                        </div>
                        <span className="text-sm truncate">{tool}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {showFavStar === tool && (
                          <span
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(tool); setFavorites(getFavorites()) }}
                            className="p-1 rounded-lg hover:bg-white/10"
                          >
                            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-[#8AFF00] text-[#8AFF00]' : 'text-zinc-500'}`} />
                          </span>
                        )}
                        <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500">
                No tools match "{query}"
              </div>
            )}
          </>
        ) : (
          <>
            <SectionTitle title="Favorites" />
            {favorites.length > 0 ? (
              <div className="space-y-2">
                {favorites.map((title) => {
                  const Icon = toolIcons[title] || LayoutGrid
                  return (
                    <button
                      key={title}
                      onClick={() => handleOpenTool(title)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#8AFF00]/10 p-2 text-[#8AFF00]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{title}</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-zinc-500">
                Hover a search result and click the star to add favorites
              </div>
            )}

            {recents.length > 0 && (
              <>
                <SectionTitle title="Recent" />
                <div className="space-y-2">
                  {recents.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => handleOpenTool(tool)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5"
                    >
                      <History className="h-4 w-4 text-zinc-500 shrink-0" />
                      <span className="truncate">{tool}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!query && recents.length === 0 && (
              <>
                <SectionTitle title="All Tools" />
                <div className="space-y-2 pb-3">
                  {tools.map((tool) => {
                    const Icon = toolIcons[tool] || LayoutGrid
                    return (
                      <button
                        key={tool}
                        onClick={() => handleOpenTool(tool)}
                        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:border-[#8AFF00]/30 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-xl bg-white/5 p-2 shrink-0">
                            <Icon className="h-4 w-4 text-zinc-300" />
                          </div>
                          <span className="text-sm truncate">{tool}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-500 shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-[#0b0b0c]/90 px-4 py-3 backdrop-blur-xl shrink-0">
        <button
          onClick={() => window.open("index.html", "_blank")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8AFF00] px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
        >
          Open Full Workspace
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-2 mt-5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
      <Star className="h-3 w-3" />
      {title}
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-4 transition hover:bg-white/[0.06]"
    >
      <div className="rounded-xl bg-white/5 p-2">
        <Icon className="h-4 w-4 text-zinc-200" />
      </div>
      <span className="text-[11px] text-zinc-300">{label}</span>
    </button>
  )
}
