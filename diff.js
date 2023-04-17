
const currentFileRegex = /#(.*)$/;
const [_, project, repo, currentPrId] = window.location.href.match(/projects\/(\w+)\/repos\/(\w+)\/pull-requests\/(\d+)/);
const unreadFiles = new Set();
const mutationObserverForUnreadFiles = new MutationObserver(handleMutations);
const config = {attributes: true, attributeFilter: ['class']}
const prDataPromise = fetch(`https://git.lucidutil.com/rest/api/latest/projects/${project}/repos/${repo}/pull-requests/${currentPrId}`).then(
    res => res.json()
);

async function markMissingReviewers() {
    const prData = await prDataPromise;
    Array.from(document.querySelectorAll(`[data-mention-id]:not([data-dn-handled])`))
        .forEach((node) => {
            node.setAttribute('data-dn-handled', '')
            if (!prData.reviewers.find(reviewer => reviewer.user.displayName === node.getAttribute('data-mention-id'))) {
                node.firstChild.style.backgroundColor = 'rgb(254, 144, 80)';
                node.firstChild.innerText += ' (not a reviewer)';
            }
        });
}


function markPage() {
    markMissingReviewers();
}

if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", markPage);
} else {
    // `DOMContentLoaded` has already fired
    markPage();
}


if (currentPrId) {
    document.addEventListener('keypress', (event) => {
        if (event.code === 'KeyU' && !event.target?.matches('input, [contenteditable=true]')) {
            const selectedFiles = document.querySelectorAll('.file-selected');
            if (selectedFiles.length) {
                event.preventDefault();
            }
            for (const fileNode of selectedFiles) {
                markFileAsUnread(fileNode);
            }
        }
    });
    let activeTimeout = undefined;
    document.addEventListener('mouseup', () => {
        if (activeTimeout == undefined) {
            activeTimeout = setTimeout(() => {
                requestAnimationFrame(() => {
                    activeTimeout = undefined;
                    markMissingReviewers();
                    if (unreadFiles.size) {
                        const mutations = mutationObserverForUnreadFiles.takeRecords();
                        if (mutations.length) {
                            handleMutations(mutations, mutationObserverForUnreadFiles);
                        }
                    }
                });
            }, 16);
        }
    })
}

function handleMutations(records, self) {
    for (const mod of records) {
        if (unreadFiles.has(mod.target)) {
            unreadFiles.delete(mod.target);
            mod.target.classList.remove('file-viewed');
        }
    }

    if (unreadFiles.size === 0) {
        self.disconnect();
    }
}

function markFileAsUnread(fileNode) {
    const filePath = fileNode.firstChild.href.split('#')[1];
    if (filePath) {
        // `pull-request-LUCID/main/${currentPrId}-user-${userName}-change-history-${range}-${path}`
        // ${range} can be 'latest' or a commit range like 'ec7eb2ebdb52739a2875bbeb244220c2ce779d25:bc65d5e3242f5718a2c7974bc0d3f0ee21da7806'
        const start = `pull-request-LUCID/main/${currentPrId}-user-${userName}-change-history`;
        const end = `-${filePath}`;
        for (const key of Object.keys(window.localStorage)) {
            if (key.endsWith(end) && key.startsWith(start)) {
                window.localStorage.removeItem(key)
            }
        }
    }
    fileNode.classList.remove('file-viewed');
    unreadFiles.add(fileNode);
    mutationObserverForUnreadFiles.observe(fileNode, config);
}
