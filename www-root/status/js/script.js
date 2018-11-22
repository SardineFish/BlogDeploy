
const statusMap = {
    "ready": {
        element: document.querySelector("#status-ready"),
        text: "Ready",
    },
    "deploy": {
        element: document.querySelector("#status-deploy"),
        text: "Deploying...",
    },
    "error": {
        element: document.querySelector("#status-error"),
        text: "Error"
    }
};
function update()
{
    fetch("/status", {
            method: "POST"
        })
        .then(response => response.json())
        .then(data => {
            let element = statusMap[data.status].element;
            let text = statusMap[data.status].text;
            let deployTime = new Date(data.lastDeployTime || 0);
            document.querySelectorAll(".status-icon").forEach(element => element.classList.remove("show"));
            element.classList.add("show");
            document.querySelector("#status-text").innerText = text;
            if (data.lastDeployTime) {
                document.querySelector("#deploy-prefix").innerText = "Last deployed at ";
                document.querySelector("#deploy-time").innerText = deployTime.toLocaleString("en");
            } else {
                document.querySelector("#deploy-prefix").innerText = "Initial deployment failed."
                document.querySelector("#deploy-time").innerText = "";
            }
            setTimeout(update, 5000);
        });
}
update();