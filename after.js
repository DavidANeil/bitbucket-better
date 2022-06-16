
const loggedInText = document.querySelector('.aui-avatar-inner img').alt;
const userName = loggedInText.match(/Logged in as ([\w ]+) \((\w+)\)/)[2];
const unfoundPrs = new Set();

Promise.all([
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests').then(handleResponse),
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests?start=25').then(handleResponse),
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests?start=50').then(handleResponse),
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests?start=75').then(handleResponse),
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests?start=100').then(handleResponse),
]).then(() => {
    const mutationObserver = new MutationObserver(() => {
        for (const prId of unfoundPrs) {
            markPr(prId);
        }
        if (unfoundPrs.size === 0) {
            mutationObserver.disconnect();
        }
    })

    document.querySelectorAll('.dashboard-pull-request-table.main-section')?.forEach((table) => {
        mutationObserver.observe(table, {childList: true, subtree: true});
    })
})

async function handleResponse(response) {
    const json = await response.json();
    json.values.forEach((pr) => {
        if (pr.pullRequest.description?.indexOf(userName) >= 0) {
            markPr(pr.pullRequest.id);
        }
    })
}

function markPr(prId) {
    const pullRequestElement = document.querySelector(`a[href="/projects/LUCID/repos/main/pull-requests/${prId}/overview"]`)?.parentElement.parentElement.parentElement.parentElement;
    if (pullRequestElement) {
        pullRequestElement.style = "background-color: antiquewhite"
        unfoundPrs.delete(prId)
    } else {
        unfoundPrs.add(prId)
    }
}