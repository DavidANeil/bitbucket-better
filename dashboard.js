const unfoundDashboardPrs = new Set();
const primaryPrs = new Set();
const pendingCommentPrs = new Set();

Promise.all([
    fetch('https://git.lucidutil.com/rest/ui/latest/dashboard/pull-requests?start=0&limit=99&role=REVIEWER&state=OPEN').then(
        handleResponse,
    ),
])
    .then(() => {
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
    })
    .catch((error) => {
        console.error(error);
    });

async function handleResponse(response) {
    const json = await response.json();
    setNumPrs(json.size);
    json.values.forEach(async (pr) => {
        if (pr.pullRequest.description?.indexOf(userName) >= 0) {
            primaryPrs.add(pr.pullRequest.id);
            await checkForPendingComments(pr);
            markDashboardPr(pr.pullRequest.id);
        } else {
            checkForPendingComments(pr);
        }
    });
}

function setNumPrs(numberOfPrs) {
    const element = document.querySelector('.reviewing-pull-requests h3');
    if (!element) {
        return;
    }
    element.childNodes[2]?.remove();
    element.insertAdjacentText("beforeend", `(${numberOfPrs})`);

}

async function checkForPendingComments(pr) {
    if (pr.pullRequest.state == 'MERGED') {
        return;
    }
    const response = await fetch(
        `https://git.lucidutil.com/rest/ui/latest/projects/${pr.pullRequest.toRef.repository.project.key}/repos/${pr.pullRequest.toRef.repository.slug}/pull-requests/${pr.pullRequest.id}/comments/count?state=PENDING`,
    );
    const json = response.ok && (await response.json());
    if (json) {
        const pendingCount = json['PENDING'] || 0;
        if (pendingCount) {
            pendingCommentPrs.add(pr.pullRequest.id);
            markDashboardPr(pr.pullRequest.id);
        }
    }
}

function markDashboardPr(prId) {
    const pullRequestElement = document.querySelector(
        `a[href="/projects/LUCID/repos/main/pull-requests/${prId}/overview"]`,
    )?.parentElement.parentElement.parentElement.parentElement;
    if (pullRequestElement) {
        if (primaryPrs.has(prId)) {
            pullRequestElement.style = 'background-color: antiquewhite';
            primaryPrs.delete(prId);
        }
        if (pendingCommentPrs.has(prId)) {
            pullRequestElement.style = 'background-color: gold';
            pendingCommentPrs.delete(prId);
        }
        unfoundDashboardPrs.delete(prId);
    } else {
        unfoundDashboardPrs.add(prId);
    }
}
