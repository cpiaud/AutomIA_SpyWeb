(function SpyOn() {
  const _id = "spyon-container",
    _posBuffer = 3;
  // new line
  let hoveredElement = null;

  function init() {
    document.body.addEventListener("mousemove", glide);
    document.body.addEventListener("mouseover", show);
    document.body.addEventListener("mouseleave", hide);
    document.body.addEventListener("contextmenu", function (e) {
      const textContent = e.target.textContent.trim();
      const filename = prompt(
        "Enter file name:",
        textContent
          ? e.target.nodeName.toLowerCase() + "_" + textContent
          : e.target.nodeName.toLowerCase() + "_" + "GiveMeAName"
      );
      if (filename) {
        saveElementToJson(e, filename);
      }
    });

    // new line
    document.addEventListener("keydown", function (e) {
      handleShortcut(e, hoveredElement);
    });
  }

  function hide(e) {
    document.getElementById(_id).style.display = "none";
  }

  function show(e) {
    const spyContainer = document.getElementById(_id);
    if (!spyContainer) {
      create();
      return;
    }
    if (spyContainer.style.display !== "block") {
      spyContainer.style.display = "block";
    }
  }

  function glide(e) {
    const spyContainer = document.getElementById(_id);
    if (!spyContainer) {
      create();
      return;
    }
    const left = e.clientX + getScrollPos().left + _posBuffer;
    const top = e.clientY + getScrollPos().top + _posBuffer;
    // new line
    hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
    spyContainer.innerHTML = showAttributes(hoveredElement);
    //spyContainer.innerHTML = showAttributes(e.target);
    if (left + spyContainer.offsetWidth > window.innerWidth) {
      spyContainer.style.left = left - spyContainer.offsetWidth + "px";
    } else {
      spyContainer.style.left = left + "px";
    }
    spyContainer.style.top = top + "px";
  }

  // new line
  async function handleShortcut(e, hoveredElement) { 
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      const spyContainer = document.getElementById(_id);
      if (!spyContainer || !hoveredElement) return;
      const textContent = hoveredElement.textContent.trim();
      const filename = hoveredElement.nodeName
        ? hoveredElement.nodeName.toLowerCase() + "_" + textContent
        : hoveredElement.nodeName.toLowerCase() + "_" + "GiveMeAName";

      await saveElementToJson(hoveredElement, filename);
    }
  }

  function getScrollPos() {
    const ieEdge = document.all ? false : true;
    if (!ieEdge) {
      return {
        left: document.body.scrollLeft,
        top: document.body.scrollTop,
      };
    } else {
      return {
        left: document.documentElement.scrollLeft,
        top: document.documentElement.scrollTop,
      };
    }
  }

  function showAttributes(el) {
    const nodeName = `<span style="font-weight:bold;">${el.nodeName.toLowerCase()}</span><br/>`;
    const attrArr = Array.from(el.attributes);
    const attributes = attrArr.reduce((attrs, attr) => {
      attrs += `<span style="color:#ffffcc;">${attr.nodeName}</span>="${attr.nodeValue}"<br/>`;
      return attrs;
    }, "");
    const textContent = `<span style="color:#ffffcc;">textContent</span>="${el.textContent.trim()}"<br/>`;
    return nodeName + attributes + textContent;
  }

  function create() {
    const div = document.createElement("div");
    div.id = _id;
    div.setAttribute(
      "style",
      `
      position: absolute;
      left: 0;
      top: 0;
      width: auto;
      height: auto;
      padding: 10px;
      box-sizing: border-box;
      color: #fff;
      background-color: #444;
      z-index: 100000;
      font-size: 12px;
      border-radius: 5px;
      line-height: 20px;
      max-width: 45%;
      `
    );
    document.body.appendChild(div);
  }

  async function saveElementToJson(e, filename) {
    const spyContainer = document.getElementById(_id);
    if (spyContainer) {
      const attributes = collectAttributes(hoveredElement);
      const jsonContent = JSON.stringify(attributes, null, 2);
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename + ".json",
          types: [{ accept: { "application/json": [".json"] } }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du fichier :", error);
      }
      // create a blob and trigger download
      // const blob = new Blob([jsonContent], { type: "application/json" });
      // const a = document.createElement("a");
      // a.href = URL.createObjectURL(blob);
      // a.download = filename + ".json";
      // a.click();
    }
  }

  function collectAttributes(el) {
    const attributes = {
      tagName: el ? el.nodeName.toLowerCase() : "unknown",
    };

    Array.from(el.attributes).forEach((attr) => {
      attributes[attr.nodeName] = attr.nodeValue;
    });

    attributes.textContent = el.textContent.trim();

    return attributes;
  }

  init();
})();
