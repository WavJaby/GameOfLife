/**
 * @param {ChunkManager} chunkManager
 * @param world
 * @constructor
 */
function TemplateManager(chunkManager, world) {
    const templateDisplay = this.templateDisplayElement = document.createElement('div');
    templateDisplay.className = 'templateDisplay disabled';
    /**@type{SVGSVGElement | null}*/
    let selectTemplate = null;
    let selectTemplateData = null;
    let selectTemplateViewBox = null;
    let templateFlip = false;
    let templateRotate = 0;

    this.loadTemplate = function () {
        const templateWindow = document.getElementById("templates");

        for (const i in TemplateModels) {
            const modelData = TemplateModels[i];
            const modelWidth = modelData[0][0];
            const modelHeight = modelData[0][1];
            // const svgWidth = 64;
            // const svgHeight = (modelHeight * svgWidth / modelWidth) | 0;
            const svgWidth = modelWidth;
            const svgHeight = modelHeight;
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
            svg.setAttribute('fill', '#00FF32');

            const gap = svgWidth / modelWidth * 0.05;
            const pixSize = svgWidth / modelWidth;
            for (let y = 0; y < modelHeight; y++) {
                for (let x = 0; x < modelWidth; x++) {
                    if (modelData[y + 1][x] !== 0) {
                        const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
                        rect.setAttribute('x', (x * pixSize).toString());
                        rect.setAttribute('y', (y * pixSize).toString());
                        rect.setAttribute('width', (pixSize - gap).toString());
                        rect.setAttribute('height', (pixSize - gap).toString());
                        svg.appendChild(rect);
                    }
                }
            }

            // Template
            const template = document.createElement('div');
            template.className = 'template';

            // Image
            const templateClone = svg.cloneNode(true);
            for (const child of templateClone.children) {
                child.setAttribute('width', '1');
                child.setAttribute('height', '1');
            }
            template.onclick = (event) => {
                if (selectTemplate === templateClone) return;
                const lastTemplate = selectTemplate;
                selectTemplate = templateClone;
                selectTemplateData = modelData.slice(1, modelHeight + 1);

                setTeamColor();
                this.updateLocation(event);

                if (lastTemplate) {
                    lastTemplate.style.transform = null;
                    templateDisplay.replaceChild(selectTemplate, lastTemplate);
                }else
                    templateDisplay.appendChild(selectTemplate);
            };
            template.appendChild(svg);

            // Name
            const templateName = document.createElement('div');
            templateName.innerText = modelData[modelHeight + 1][1];
            template.appendChild(templateName);
            templateWindow.appendChild(template);
        }
    }

    function setTeamColor() {
        selectTemplate.setAttribute("fill", cellStateColors[teamID + 1].toString());
    }

    this.updateLocation = function (event) {
        if (selectTemplate === null) return;
        let modelWidth, modelHeight, ratioOffset;
        if (templateRotate % 2 === 0) {
            modelWidth = selectTemplateData[0].length;
            modelHeight = selectTemplateData.length;
            ratioOffset = 0;
        } else {
            modelWidth = selectTemplateData.length;
            modelHeight = selectTemplateData[0].length;
            ratioOffset = (modelWidth - modelHeight) / 2 % 1;
        }

        const worldX = (world.x + 0.5) | 0;
        const worldY = (world.y + 0.5) | 0;
        const centerOffX = modelWidth / 2 - 0.5;
        const centerOffY = modelHeight / 2 - 0.5;
        const x = (event.clientX - worldX) / world.scale - centerOffX - ratioOffset;
        const y = (event.clientY - worldY) / world.scale - centerOffY + ratioOffset;
        selectTemplate.style.left = (worldX + ((x - (x < 0) | 0) + ratioOffset) * world.scale) + 'px';
        selectTemplate.style.top = (worldY + ((y - (y < 0) | 0) - ratioOffset) * world.scale) + 'px';
        selectTemplate.setAttribute('width', (modelWidth * world.scale).toString());
        selectTemplate.setAttribute('height', (modelHeight * world.scale).toString());
    }

    this.rotateTemplate = function (event) {
        if (event.key === 'r') {
            const modelWidth = selectTemplateData[0].length;
            const modelHeight = selectTemplateData.length;
            let newModel = [];
            for (let x = 0; x < modelWidth; x++) {
                let cache = [];
                for (let y = modelHeight - 1; y > -1; y--) {
                    cache.push(selectTemplateData[y][x]);
                }
                newModel.push(cache);
            }
            selectTemplateData = newModel;

            if (templateRotate === 3) templateRotate = 0;
            else templateRotate++;
            setTemplateTransform();
        } else if (event.key === 'f') {
            const modelWidth = selectTemplateData[0].length;
            const modelHeight = selectTemplateData.length;
            let newModel = [];
            for (let y = 0; y < modelHeight; y++) {
                let cache = [];
                for (let x = modelWidth - 1; x > -1; x--) {
                    cache.push(selectTemplateData[y][x]);
                }
                newModel.push(cache);
            }
            selectTemplateData = newModel;

            templateFlip = !templateFlip;
            setTemplateTransform();
        } else if (event.key === 'Escape') {
            this.clearSelect();
        }
    }

    function setTemplateTransform() {
        selectTemplate.style.transform = `rotate(${templateRotate * 90}deg) scale(${templateFlip ? -1 : 1},1)`;
    }

    this.checkPlaceTemplate = function (event) {
        const modelWidth = selectTemplateData[0].length;
        const modelHeight = selectTemplateData.length;
        const worldX = (world.x + 0.5) | 0;
        const worldY = (world.y + 0.5) | 0;
        const centerOffX = modelWidth / 2 - 0.5;
        const centerOffY = modelHeight / 2 - 0.5;
        const offsetX = (event.offsetX - worldX) / world.scale - centerOffX;
        const offsetY = (event.offsetY - worldY) / world.scale - centerOffY;
        const startX = (offsetX - (offsetX < 0)) | 0;
        const startY = (offsetY - (offsetY < 0)) | 0;
        // console.log(startX, startY);

        const change = {};
        if (chunkManager.checkRangeAlive(startX, startY, modelWidth, modelHeight, change, selectTemplateData)) {
            selectTemplate.setAttribute("fill", placeErrorColor.toString());
            setTimeout(setTeamColor, 200);
            return null;
        }

        return change;
    }

    this.clearSelect = function () {
        templateDisplay.removeChild(selectTemplate);
        selectTemplate.style.transform = null;
        selectTemplate = null;
        selectTemplateData = null;
        selectTemplateViewBox = null;
        templateFlip = false;
        templateRotate = 0;
    }

    this.selectTemplate = function () {
        return selectTemplate !== null;
    }
}