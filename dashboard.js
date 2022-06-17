
const unfoundDashboardPrs = new Set();

Promise.all([
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests?start=0&limit=100&role=REVIEWER').then(handleResponse),
]).then(() => {
    const mutationObserver = new MutationObserver(() => {
        for (const prId of unfoundDashboardPrs) {
            markDashboardPr(prId);
        }
        if (unfoundDashboardPrs.size === 0) {
            mutationObserver.disconnect();
        }
    });

    document.querySelectorAll('.dashboard-pull-request-table.main-section')?.forEach((table) => {
        mutationObserver.observe(table, {childList: true, subtree: true});
    });
}).catch((error) => {
    console.error(error);
})

async function handleResponse(response) {
    const json = await response.json();
    json.values.forEach((pr) => {
        if (pr.pullRequest.description?.indexOf(userName) >= 0) {
            markDashboardPr(pr.pullRequest.id);
        }
    })
}

function markDashboardPr(prId) {
    const pullRequestElement = document.querySelector(`a[href="/projects/LUCID/repos/main/pull-requests/${prId}/overview"]`)?.parentElement.parentElement.parentElement.parentElement;
    if (pullRequestElement) {
        pullRequestElement.style = "background-color: antiquewhite";
        unfoundDashboardPrs.delete(prId);
    } else {
        unfoundDashboardPrs.add(prId);
    }
}