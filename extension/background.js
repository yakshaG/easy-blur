chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        id: "injectScript",
        title: "Easy Blur",
        contexts: ["page"]
    });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "injectScript") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: injectScript
        });
    }
});

function injectScript() {
    chrome.storage.local.get(["blurIntensity", "blurKey", "unblurKey", "exitKey"]).then((result) => {
        let blurIntensity = 6
        let blurKey = "b"
        let unblurKey = "u"
        let exitKey = "q"

        if (result.blurIntensity)
            blurIntensity = result.blurIntensity
        if (result.blurKey)
            blurKey = result.blurKey
        if (result.unblurKey)
            unblurKey = result.unblurKey
        if (result.exitKey)
            exitKey = result.exitKey

        const existingStyleTag = document.querySelector('style[data-extension-styles]');
        const newStyles = `
                .blur-element {
                    filter: blur(${blurIntensity}px)!important;
                }
    
                .highlight-blurred-element{
                    outline: red solid 4px!important;
                    filter: blur(0px)!important;
                }
                
                 .highlight-unblurred-element {
                    outline: red solid 4px!important;
                }

                .custom-cursor{
                    position: fixed;
                    padding: 1rem;
                    background-color: rgba(255,255,255,0.3);
                    backdrop-filter: blur(16px);
                    z-index: 1000;
                    border-radius: 16px;
                    box-shadow: 0px 0px 24px 2px rgba(0,0,0, 0.25);
                }

                .custom-cursor-text{
                    margin: 0px;
                }
                `;

        if (existingStyleTag) {
            existingStyleTag.textContent += newStyles;
        } else {
            const style = document.createElement('style');
            style.textContent = newStyles;
            style.setAttribute('data-extension-styles', ''); // Add a data attribute for identification
            document.head.appendChild(style);
        }

        //custom cursor help text
        const html = document.querySelector("html")
        const customCursor = document.createElement("div");
        const customCursorText = document.createElement("p")
        const defaultHelpText = `<span>👉 Press <b>"${blurKey}"</b> to lock blur <br /> 👉 Press <b>"${unblurKey}"</b> to unlock blur <br /> 👉 Press <b>"${exitKey}"</b> to stop selecting<span>`
        customCursor.append(customCursorText)
        html.append(customCursor)

        customCursor.classList.add("custom-cursor")
        customCursorText.classList.add("custom-cursor-text")
        customCursorText.innerHTML = defaultHelpText


        // Start blurring in response to various events
        document.addEventListener("mousemove", MoveHelpText)
        document.addEventListener("mouseover", DocMouseOver);
        document.addEventListener("keydown", DocBlurKey)
        document.addEventListener("keydown", DocUnblurKey)

        //Stop blurring in response to various events
        document.addEventListener("keydown", exitHoverMode)
        document.addEventListener("contextmenu", () => {
            clearHoverMode()
            return
        })
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            clearHoverMode()
            return
        });



        function DocMouseOver(event) {
            const target = event.target;
            const isElementBlurred = target.classList.contains("blur-element")

            // Check if the target is an element (not a text node or something else)
            if (target.nodeType === 1) {
                target.setAttribute("target-element", "true")
                if (isElementBlurred)
                    target.classList.add("highlight-blurred-element")
                else
                    target.classList.add("highlight-unblurred-element")

                target.addEventListener("mouseout", () => {
                    target.removeAttribute("target-element")
                    if (isElementBlurred)
                        target.classList.remove("highlight-blurred-element")
                    else
                        target.classList.remove("highlight-unblurred-element")
                })
            }
        }

        function MoveHelpText(event) {
            // move the instruction with cursor
            const x = event.clientX;
            const y = event.clientY;

            customCursor.style.left = x + 12 + 'px';
            customCursor.style.top = y + 12 + 'px';
        }

        function DocBlurKey(event) {
            if (event.key === blurKey) {
                const elementToLock = document.querySelector("[target-element='true']")
                elementToLock.classList.add("blur-element")
                customCursorText.innerHTML = "Blur locked until next refresh!"
                setTimeout(() => {
                    customCursorText.innerHTML = defaultHelpText
                }, 2500);
            }
        }

        function DocUnblurKey(event) {
            if (event.key === unblurKey) {
                const elementToLock = document.querySelector("[target-element='true']")
                elementToLock.classList.remove("blur-element")
                customCursorText.innerHTML = "Blur unlocked until next refresh!"
                setTimeout(() => {
                    customCursorText.innerHTML = defaultHelpText
                }, 2500);
            }
        }

        function exitHoverMode(event) {
            if (event.key === exitKey) {
                document.removeEventListener("mousemove", MoveHelpText)
                customCursor.remove()
                document.removeEventListener("mouseover", DocMouseOver)
                document.removeEventListener("keydown", DocBlurKey)
                document.removeEventListener("keydown", DocUnblurKey)
            }
        }

        function clearHoverMode() {
            document.removeEventListener("mousemove", MoveHelpText)
            customCursor.remove()
            document.removeEventListener("mouseover", DocMouseOver)
            document.removeEventListener("keydown", DocBlurKey)
            document.removeEventListener("keydown", DocUnblurKey)
        }
    })
}



