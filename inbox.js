const unfoundInboxPrs = new Set();

const inboxMenu = document.querySelector('li.inbox-menu');
inboxMenu?.addEventListener('mouseenter', onMouseEnter);
const alreadyOpenDialog = document.querySelector('#inline-dialog-inbox-pull-requests-content');

function onMouseEnter() {
    inboxMenu.removeEventListener('mouseenter', onMouseEnter);
    fetch('https://git.lucidutil.com/rest/api/latest/inbox/pull-requests?limit=100')
        .then(handleResponse)
        .then(() => {
            const mutationObserver = new MutationObserver((a) => {
                for (const prId of unfoundInboxPrs) {
                    markInboxPr(prId);
                }
                if (unfoundInboxPrs.size === 0) {
                    mutationObserver.disconnect();
                }
            });

            mutationObserver.observe(alreadyOpenDialog, {attributes: true, childList: true, subtree: true});
            mutationObserver.takeRecords();
        })
        .catch((e) => {
            console.error(e);
        });
}

async function handleResponse(response) {
    const json = await response.json();
    json.values.forEach((pr) => {
        if (pr.description?.indexOf(userName) >= 0) {
            markInboxPr(pr.id);
        }
    });
}

function markInboxPr(prId) {
    const pullRequestElement = alreadyOpenDialog.querySelector(
        `a[href="/projects/LUCID/repos/main/pull-requests/${prId}/overview"]`,
    )?.parentElement.parentElement.parentElement;
    if (pullRequestElement) {
        pullRequestElement.style = 'background-color: antiquewhite';
        unfoundInboxPrs.delete(prId);
    } else {
        unfoundInboxPrs.add(prId);
    }
}
