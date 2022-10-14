
const currentFileRegex = /#(.*)$/;
const currentPrId = window.location.href.match(/pull-requests\/(\d+)/)?.[1];
const unreadFiles = new Set();
const mutationObserverForUnreadFiles = new MutationObserver(handleMutations);
const config = {attributes: true, attributeFilter: ['class']}

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
        if (unreadFiles.size && activeTimeout == undefined) {
            activeTimeout = setTimeout(() => {
                requestAnimationFrame(() => {
                    activeTimeout = undefined;
                    const mutations = mutationObserverForUnreadFiles.takeRecords();
                    if (mutations.length) {
                        handleMutations(mutations, mutationObserverForUnreadFiles);
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
