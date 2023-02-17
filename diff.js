
const currentFileRegex = /#(.*)$/;
const [_, project, repo, currentPrId] = window.location.href.match(/projects\/(\w+)\/repos\/(\w+)\/pull-requests\/(\d+)/);
const unreadFiles = new Set();
const mutationObserverForUnreadFiles = new MutationObserver(handleMutations);
const config = {attributes: true, attributeFilter: ['class']}
const prDataPromise = fetch(`https://git.lucidutil.com/rest/api/latest/projects/${project}/repos/${repo}/pull-requests/${currentPrId}`).then(
    res => res.json()
);

async function markMissingReviewers(){
    const prData = await prDataPromise;
    Array.from(document.querySelectorAll(`[data-mention-id]:not([data-dn-handled])`))
        .flatMap(node =>
            prData.reviewers.find(reviewer => reviewer.user.displayName === node.getAttribute('data-mention-id')) ? [] : node
        )
        .forEach((node) => {
            node.setAttribute('data-dn-handled', '')
            node.firstChild.style.backgroundColor = 'rgb(254, 144, 80)';
            node.firstChild.innerText += ' (not a reviewer)';
        });


}
markMissingReviewers();


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
        window.localStorage.removeItem(`pull-request-LUCID/main/${currentPrId}-user-${userName}-change-history-latest-${filePath}`)
    }
    fileNode.classList.remove('file-viewed');
    unreadFiles.add(fileNode);
    mutationObserverForUnreadFiles.observe(fileNode, config);
}
