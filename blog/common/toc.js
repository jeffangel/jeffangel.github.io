document.addEventListener("DOMContentLoaded", () => {
    const content = document.querySelector("main");
    const tocList = document.getElementById("toc-list");
    if (!content || !tocList) return;

    const headings = content.querySelectorAll("h2, h3, h4");
    let lastLiH2 = null;
    let lastLiH3 = null;

    headings.forEach((heading) => {
        if (heading.hasAttribute("data-no-toc")) {
            return;
        }

        if (!heading.id) {
            heading.id = heading.textContent
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/gi, "")
                .replace(/\s+/g, "-");
        }

        const a = document.createElement("a");
        a.href = "#" + heading.id;
        a.textContent = heading.textContent;

        if (heading.tagName.toLowerCase() === "h2") {
            // Nivel H2
            a.className =
                "block pl-10 pr-2 py-1.5 font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200";
            const li = document.createElement("li");
            li.className = "list-none ml-4";
            li.appendChild(a);
            tocList.appendChild(li);
            lastLiH2 = li;
            lastLiH3 = null; // reseteamos porque cambia el nivel
        } 
        else if (heading.tagName.toLowerCase() === "h3" && lastLiH2) {
            // Nivel H3 → dentro de H2
            let subUl = lastLiH2.querySelector("ul");
            if (!subUl) {
                subUl = document.createElement("ul");
                subUl.className = "list-none m-0 p-0 ml-4";
                lastLiH2.appendChild(subUl);
            }
            const subLi = document.createElement("li");
            subLi.className = "list-none";
            a.className =
                "block pl-4 pr-2 py-1 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200";
            subLi.appendChild(a);
            subUl.appendChild(subLi);
            lastLiH3 = subLi;
        } 
        else if (heading.tagName.toLowerCase() === "h4" && lastLiH3) {
            // Nivel H4 → dentro de H3
            let subSubUl = lastLiH3.querySelector("ul");
            if (!subSubUl) {
                subSubUl = document.createElement("ul");
                subSubUl.className = "list-none m-0 p-0 ml-6"; // más sangría que H3
                lastLiH3.appendChild(subSubUl);
            }
            const subSubLi = document.createElement("li");
            subSubLi.className = "list-none";
            a.className =
                "block pl-4 pr-2 py-1 text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200";
            subSubLi.appendChild(a);
            subSubUl.appendChild(subSubLi);
        }
    });
});
