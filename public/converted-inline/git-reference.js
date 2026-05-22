
        const commands = {
            init: {
                category: 'Initialization',
                items: [
                    {
                        name: 'git init',
                        syntax: 'git init',
                        description: 'Initialize a new git repository',
                        danger: 'safe'
                    },
                    {
                        name: 'git clone',
                        syntax: 'git clone <repository-url>',
                        description: 'Clone an existing repository',
                        danger: 'safe'
                    }
                ]
            },
            staging: {
                category: 'Staging & Commits',
                items: [
                    {
                        name: 'git add',
                        syntax: 'git add <file>\
git add . # Add all files',
                        description: 'Stage changes for commit',
                        danger: 'safe'
                    },
                    {
                        name: 'git commit',
                        syntax: 'git commit -m "message"\
git commit --amend # Modify last commit',
                        description: 'Create a commit with staged changes',
                        danger: 'careful'
                    },
                    {
                        name: 'git status',
                        syntax: 'git status',
                        description: 'View status of working directory',
                        danger: 'safe'
                    },
                    {
                        name: 'git diff',
                        syntax: 'git diff\
git diff --staged',
                        description: 'View changes between commits/branches',
                        danger: 'safe'
                    }
                ]
            },
            branching: {
                category: 'Branching',
                items: [
                    {
                        name: 'git branch',
                        syntax: 'git branch <branch-name>\
git branch -a # List all branches',
                        description: 'Create or list branches',
                        danger: 'safe'
                    },
                    {
                        name: 'git checkout',
                        syntax: 'git checkout <branch-name>\
git checkout -b <branch-name> # Create & switch',
                        description: 'Switch branches or restore files',
                        danger: 'careful'
                    },
                    {
                        name: 'git switch',
                        syntax: 'git switch <branch-name>\
git switch -c <branch-name> # New branch',
                        description: 'Modern way to switch branches',
                        danger: 'safe'
                    },
                    {
                        name: 'git merge',
                        syntax: 'git merge <branch-name>',
                        description: 'Merge another branch into current',
                        danger: 'careful'
                    },
                    {
                        name: 'git branch -d',
                        syntax: 'git branch -d <branch-name>\
git branch -D <branch-name> # Force delete',
                        description: 'Delete a branch',
                        danger: 'careful'
                    }
                ]
            },
            remotes: {
                category: 'Remotes',
                items: [
                    {
                        name: 'git remote',
                        syntax: 'git remote -v # List all remotes\
git remote add <name> <url>',
                        description: 'Manage remote repositories',
                        danger: 'safe'
                    },
                    {
                        name: 'git push',
                        syntax: 'git push <remote> <branch>\
git push --all # Push all branches',
                        description: 'Push commits to remote',
                        danger: 'careful'
                    },
                    {
                        name: 'git pull',
                        syntax: 'git pull <remote> <branch>',
                        description: 'Fetch and merge from remote',
                        danger: 'careful'
                    },
                    {
                        name: 'git fetch',
                        syntax: 'git fetch <remote>\
git fetch --all',
                        description: 'Fetch updates from remote without merging',
                        danger: 'safe'
                    }
                ]
            },
            undoing: {
                category: 'Undoing Changes',
                items: [
                    {
                        name: 'git restore',
                        syntax: 'git restore <file> # Discard changes\
git restore --staged <file>',
                        description: 'Discard changes in working directory',
                        danger: 'destructive'
                    },
                    {
                        name: 'git reset',
                        syntax: 'git reset HEAD~1 # Undo last commit\
git reset --hard # Reset to HEAD',
                        description: 'Reset HEAD to a previous state',
                        danger: 'destructive'
                    },
                    {
                        name: 'git revert',
                        syntax: 'git revert <commit-hash>',
                        description: 'Create new commit that undoes changes',
                        danger: 'safe'
                    },
                    {
                        name: 'git clean',
                        syntax: 'git clean -fd # Remove untracked files\
git clean -fdx # Include ignored files',
                        description: 'Remove untracked files',
                        danger: 'destructive'
                    }
                ]
            },
            rebasing: {
                category: 'Rebasing',
                items: [
                    {
                        name: 'git rebase',
                        syntax: 'git rebase <branch>\
git rebase -i HEAD~3 # Interactive rebase',
                        description: 'Reapply commits on top of another branch',
                        danger: 'destructive'
                    },
                    {
                        name: 'git rebase --continue',
                        syntax: 'git rebase --continue\
git rebase --abort',
                        description: 'Continue or abort rebase',
                        danger: 'careful'
                    }
                ]
            },
            stashing: {
                category: 'Stashing',
                items: [
                    {
                        name: 'git stash',
                        syntax: 'git stash\
git stash list # View stashes',
                        description: 'Temporarily save uncommitted changes',
                        danger: 'safe'
                    },
                    {
                        name: 'git stash apply',
                        syntax: 'git stash apply\
git stash pop # Apply and remove',
                        description: 'Restore stashed changes',
                        danger: 'safe'
                    }
                ]
            },
            viewing: {
                category: 'Viewing History',
                items: [
                    {
                        name: 'git log',
                        syntax: 'git log\
git log --oneline --graph --all',
                        description: 'View commit history',
                        danger: 'safe'
                    },
                    {
                        name: 'git show',
                        syntax: 'git show <commit-hash>\
git show <branch-name>',
                        description: 'Show commit details',
                        danger: 'safe'
                    },
                    {
                        name: 'git blame',
                        syntax: 'git blame <file>',
                        description: 'View who changed each line',
                        danger: 'safe'
                    }
                ]
            }
        };

        const scenarios = [
            {
                problem: '❌ I committed to the wrong branch',
                solution: 'git reset HEAD~1 # Undo last commit\
git checkout <correct-branch>\
git commit -m "fixed message"'
            },
            {
                problem: '❌ I need to undo the last commit',
                solution: 'git reset HEAD~1 # Keep changes\
git reset --hard HEAD~1 # Discard changes'
            },
            {
                problem: '❌ I want to squash commits',
                solution: 'git rebase -i HEAD~3 # Interactive rebase last 3 commits\
# Mark commits as "squash" or "s"'
            },
            {
                problem: '❌ I accidentally deleted a branch',
                solution: 'git reflog # Find the commit hash\
git checkout -b <branch-name> <commit-hash>'
            },
            {
                problem: '❌ I have uncommitted changes on wrong branch',
                solution: 'git stash # Save changes\
git checkout <correct-branch>\
git stash pop # Restore'
            },
            {
                problem: '❌ I need to discard all local changes',
                solution: 'git reset --hard origin/<branch-name>'
            },
            {
                problem: '❌ I need to change a commit message',
                solution: 'git commit --amend -m "new message"\
git push --force-with-lease'
            },
            {
                problem: '❌ How do I rebase my PR to latest main',
                solution: 'git fetch origin\
git rebase origin/main\
git push --force-with-lease'
            }
        ];

        function switchTab(e, tabName) {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            e.target.classList.add('active');

            if (tabName === 'cheatsheet') populateCheatsheet();
            if (tabName === 'scenarios') populateScenarios();
        }

        function getBadge(danger) {
            const badges = {
                'safe': '<span class="safe-badge">✓ Safe</span>',
                'careful': '<span class="careful-badge">⚠ Careful</span>',
                'destructive': '<span class="danger-badge">🔴 Destructive</span>'
            };
            return badges[danger] || '';
        }

        function populateCheatsheet() {
            let html = '';
            for (const [key, data] of Object.entries(commands)) {
                html += `<div class="section-title">${data.category}</div>`;
                data.items.forEach(cmd => {
                    html += `
                        <div class="command-card">
                            <div class="command-name">${cmd.name}</div>
                            <div class="command-syntax" onclick="copyCommand(this)">${cmd.syntax.replace(/\
/g, '<br>')}</div>
                            <div class="command-desc">${cmd.description}</div>
                            ${getBadge(cmd.danger)}
                        </div>
                    `;
                });
            }
            document.getElementById('cheatsheetContent').innerHTML = html;
        }

        function populateScenarios() {
            let html = '<div class="section-title">Common Git Scenarios</div>';
            scenarios.forEach((s, idx) => {
                html += `
                    <div class="scenario-item" onclick="toggleScenario(${idx})">
                        <strong>${s.problem}</strong>
                        <div class="scenario-solution" id="scenario-${idx}" style="display:none; margin-top: 0.75rem; background: #0a0e27; padding: 0.75rem; border-radius: 3px; cursor: pointer; font-size: 0.85rem;">
                            <code style="white-space: pre-wrap; word-break: break-word;">${s.solution.replace(/\
/g, '<br>')}</code>
                        </div>
                    </div>
                `;
            });
            document.getElementById('scenariosContent').innerHTML = html;
        }

        function toggleScenario(idx) {
            const el = document.getElementById(`scenario-${idx}`);
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }

        function copyCommand(el) {
            const text = el.textContent;
            navigator.clipboard.writeText(text);
            const orig = el.textContent;
            el.textContent = '✓ Copied!';
            setTimeout(() => el.textContent = orig, 1500);
        }

        function updateBuilderOptions() {
            const builderOptions = document.getElementById('builderOptions');
            builderOptions.innerHTML = '<button onclick="buildCommand()">Build Command</button>';
        }

        function buildCommand() {
            document.getElementById('builtCommand').textContent = 'git log --oneline --graph --all --decorate';
        }

        function copyBuiltCommand() {
            const cmd = document.getElementById('builtCommand').textContent;
            navigator.clipboard.writeText(cmd);
            alert('✓ Copied: ' + cmd);
        }

        // Initial load
        populateCheatsheet();

// Event listeners for data-click/data-change/data-input/data-keyup/data-keydown attributes
(function() {
  var ready = function() {
    // Click handlers
    document.querySelectorAll('[data-click]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        var fn = el.getAttribute('data-click');
        var tab = el.getAttribute('data-tab');
        var arg = el.getAttribute('data-arg');
        var params = el.getAttribute('data-params');
        if (fn === 'closePanel') { if (window.closePanel) window.closePanel(); return; }
        if (fn === 'close') { try { parent.postMessage({action: 'close'}, '*'); } catch(e) { window.close(); } return; }
        if (fn === 'switchTab' && tab) { if (window.switchTab) window.switchTab(e, tab); return; }
        if (fn === 'toggleCrit') { if (window.toggleCrit) window.toggleCrit(el); return; }
        if (fn === 'setDepth' && arg) { if (window.setDepth) window.setDepth(parseInt(arg), el); return; }
        if (fn === 'switchMode' && arg) { if (window.switchMode) window.switchMode(arg, el); return; }
        if (fn === 'setAction' && arg) { if (window.setAction) window.setAction(arg, el); return; }
        if (fn === 'insertMarkdown' && params) {
          var parts = params.split('|');
          if (window.insertMarkdown) window.insertMarkdown(parts[0]||'', parts[1]||'', parts[2]||'');
          return;
        }
        if (arg !== null && arg !== undefined) {
          if (window[fn]) window[fn](arg);
        } else if (params) {
          var p = params.split('|');
          if (window[fn]) window[fn](p[0]||'', p[1]||'', p[2]||'');
        } else {
          if (window[fn]) window[fn](el);
        }
      });
    });

    // Change handlers
    document.querySelectorAll('[data-change]').forEach(function(el) {
      el.addEventListener('change', function() {
        var fn = el.getAttribute('data-change');
        if (fn === 'applyHeading') { if (window.applyHeading) { window.applyHeading(el.value); el.value = ''; } return; }
        if (fn === 'applyFont') { if (window.applyFont) window.applyFont(el.value); return; }
        if (fn === 'applyFontWeight') { if (window.applyFontWeight) window.applyFontWeight(el.value); return; }
        if (fn === 'onLangChange') { if (window.onLangChange) window.onLangChange(el); return; }
        if (window[fn]) window[fn]();
      });
    });

    // Input handlers
    document.querySelectorAll('[data-input]').forEach(function(el) {
      el.addEventListener('input', function() {
        var fn = el.getAttribute('data-input');
        if (window[fn]) window[fn]();
      });
    });

    // Keyup handlers
    document.querySelectorAll('[data-keyup]').forEach(function(el) {
      el.addEventListener('keyup', function() {
        var fn = el.getAttribute('data-keyup');
        if (window[fn]) window[fn]();
      });
    });

    // Keydown handlers
    document.querySelectorAll('[data-keydown]').forEach(function(el) {
      el.addEventListener('keydown', function(e) {
        var fn = el.getAttribute('data-keydown');
        if (fn === 'sendOnEnter' && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (window.sendMsg) window.sendMsg();
        }
      });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
