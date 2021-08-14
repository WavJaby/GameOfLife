const imageWidth = 200;

const exampleModels = new ExampleModels();
let model;
let selectModel = false;

function loadExample() {
    const exampleWindow = document.getElementById("examples");
    const imageCanvas = document.createElement('canvas'), ctx = imageCanvas.getContext('2d');

    for (const i of exampleModels.models) {
        const modelWidth = i[0][0];
        const modelHeight = i[0][1];
        const width = imageWidth;
        const height = (imageWidth / modelWidth) * modelHeight | 0;
        const buffer = new Uint8ClampedArray(width * height * 4);
        ctx.canvas.width = width;
        ctx.canvas.height = height;


        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pos = (y * width + x) * 4; // position in buffer based on x and y
                const pisY = y / height * modelHeight | 0;
                const pisX = x / width * modelWidth | 0;
                let color = i[pisY + 1][pisX];

                //中間的空細
                if ((x / width * modelWidth) - pisX > 0.95)
                    color = 0;
                if ((y / height * modelHeight) - pisY > 0.95)
                    color = 0;

                // R value [0, 255]
                buffer[pos] = 0;
                // G value
                buffer[pos + 1] = color * 255;
                // B value
                buffer[pos + 2] = color * 50;
                // alpha channel
                buffer[pos + 3] = color * 255;
            }
        }

        let imageData = ctx.createImageData(width, height);
        imageData.data.set(buffer);
        ctx.putImageData(imageData, 0, 0);
        //圖片本人
        let image = document.createElement('img');
        image.src = imageCanvas.toDataURL();
        //圖片本人
        let name = document.createElement('div');
        name.innerText = i[modelHeight + 1][1];
        //按鈕
        let button = document.createElement('div');
        button.className = 'exampleImage';
        button.onclick = () => {
            model = i;
            selectModel = true;
        }
        button.appendChild(name)
        button.appendChild(image)
        exampleWindow.appendChild(button);
    }
}
