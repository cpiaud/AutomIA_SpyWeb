(function SpyOn() {
  const _id = "spyon-container",
    _posBuffer = 3;
  let hoveredElement = null;
  let originalOutline = null; // Store the original outline style
  const defaultFileName = "GiveMeAName";
  const truncateCount = 2000;
  let lastSelectedFileHandle = null;

  function init() {
    document.body.addEventListener("mousemove", glide);
    document.body.addEventListener("mouseover", show);
    document.body.addEventListener("mouseleave", hide);
    document.body.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", function (e) {
      handleShortcut(e, hoveredElement);
    });
  }

  function hide(e) {
    const spyContainer = document.getElementById(_id);
    if (spyContainer) {
      spyContainer.style.display = "none";
    }
    if (hoveredElement) {
        // Restore the original outline style when hiding
      hoveredElement.style.outline = originalOutline;
      originalOutline = null;
    }
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
    const newHoveredElement = document.elementFromPoint(e.clientX, e.clientY);
    if (newHoveredElement !== hoveredElement) {
      if (hoveredElement) {
        // Restore the original outline style when moving to a new element
        hoveredElement.style.outline = originalOutline;
        originalOutline = null;
      }
      hoveredElement = newHoveredElement;
      if (hoveredElement) {
          // Store the original outline before changing it
        originalOutline = hoveredElement.style.outline;
        hoveredElement.style.outline = "2px solid red";
        const siblings = getSiblings(hoveredElement);
        const siblingCount = siblings.length;
        spyContainer.innerHTML =
          showAttributes(hoveredElement) +
          `Elements brothers: ${siblingCount}<br/>`;
      }
    }
    if (spyContainer) {
      const left = e.clientX + getScrollPos().left + _posBuffer;
      const top = e.clientY + getScrollPos().top + _posBuffer;
      if (left + spyContainer.offsetWidth > window.innerWidth) {
        spyContainer.style.left = left - spyContainer.offsetWidth + "px";
      } else {
        spyContainer.style.left = left + "px";
      }
      spyContainer.style.top = top + "px";
    }
  }

  async function handleContextMenu(e) {
    e.preventDefault();
    const spyContainer = document.getElementById(_id);
    if (!spyContainer || !hoveredElement) return;
    const textContent = hoveredElement.textContent.trim();
    const filename = textContent
      ? hoveredElement.nodeName.toLowerCase() + "_" + textContent
      : hoveredElement.nodeName.toLowerCase() + "_" + defaultFileName;

    await saveElementToJson(hoveredElement, filename);
  }

  async function handleShortcut(e, hoveredElement) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      const spyContainer = document.getElementById(_id);
      if (!spyContainer || !hoveredElement) return;
      const textContent = hoveredElement.textContent.trim();
      const filename = textContent
        ? hoveredElement.nodeName.toLowerCase() + "_" + textContent
        : hoveredElement.nodeName.toLowerCase() + "_" + defaultFileName;

      await (hoveredElement, filename);
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
    let parentContent = "";
    let parent = el.parentElement;
    while (parent) {
      const parentAttributes = Array.from(parent.attributes)
        .map((attr) => {
          return `<span style="color:#ffffcc;">${attr.nodeName}</span>="${attr.nodeValue}"`;
        })
        .join("&nbsp;");
      parentContent += `<span style="color:#ffffcc;">Parent Node Name:</span> ${parent.nodeName.toLowerCase()} ${parentAttributes}<br/>`;
      parent = parent.parentElement;
    }
    return nodeName + attributes + textContent + parentContent;
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
    if (spyContainer && hoveredElement) {
      const tempOriginalOutline = hoveredElement.style.outline;
      hoveredElement.style.outline = "";

      const attributes = collectAttributes(hoveredElement);
      hoveredElement.style.outline = tempOriginalOutline;

      const jsonContent = JSON.stringify(attributes, null, 2);
      try {
        const options = {
          suggestedName: filename + ".json",
          types: [{ accept: { "application/json": [".json"] } }],
        };

        let fileHandle;
        if (lastSelectedFileHandle) {
          fileHandle = await window.showSaveFilePicker({ ...options, startIn: lastSelectedFileHandle });
        } else {
          fileHandle = await window.showSaveFilePicker(options);
        }

        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();

        lastSelectedFileHandle = fileHandle;

      } catch (error) {
        console.error("Erreur lors de l'enregistrement du fichier :", error);
      }
    }
  }

  function downloadJson(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }


  function getSiblings(el) {
    const parent = el.parentElement;
    if (!parent) return [];
    return Array.from(parent.children).filter((child) => child !== el);
  }

  function truncate(str, maxlength) {
    if (str.length > maxlength) {
      return str.slice(0, maxlength - 1) + "…";
    }
    return str;
  }

  function collectAttributes(el) {
    const attributes = {
      tagName: el ? el.nodeName.toLowerCase() : "unknown",
      parents: [],
      siblings: [],
    };
    Array.from(el.attributes).forEach((attr) => {
      attributes[attr.nodeName] = attr.nodeValue;
    });

    attributes.textContent = el.textContent.trim();
    let parent = el.parentElement;
    while (parent) {
      const parentAttributes = {
        tagName: parent.nodeName.toLowerCase(),
      };

      Array.from(parent.attributes).forEach((attr) => {
        parentAttributes[attr.nodeName] = attr.nodeValue;
      });

      if (
        parent.nodeName.toLowerCase() !== "html" &&
        parent.nodeName.toLowerCase() !== "body"
      ) {
        parentAttributes.textContent = truncate(
          parent.textContent.trim(),
          truncateCount
        );
      }
      attributes.parents.push(parentAttributes);

      parent = parent.parentElement;
    }
    const siblings = getSiblings(el);
    siblings.forEach((sibling) => {
      const siblingAttributes = {
        tagName: sibling.nodeName.toLowerCase(),
      };
      Array.from(sibling.attributes).forEach((attr) => {
        siblingAttributes[attr.nodeName] = attr.nodeValue;
      });
      siblingAttributes.textContent = sibling.textContent.trim();
      attributes.siblings.push(siblingAttributes);
    });

    return attributes;
  }

  init();
})();
