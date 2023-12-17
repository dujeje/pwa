let video;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(function (registration) {
            console.log('Service Worker Registered', registration);
        })
        .catch(function (error) {
            console.log('Service Worker Registration Failed', error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    video = document.getElementById('camera-stream');
    const form = document.getElementById("recipe-form");
    const imageInput = document.getElementById("recipe-image");
    const imagePreview = document.getElementById("image-preview");

    document.getElementById('open-camera').addEventListener('click', function () {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function (mediaStream) {
                    video.srcObject = mediaStream;
                    video.style.display = 'block';
                    video.play();

                    document.getElementById('capture-photo').style.display = 'block';
                })
                .catch(function (err) {
                    console.log("An error occurred: " + err);
                    imageInput.style.display = 'block';
                    document.getElementById('capture-photo').style.display = 'none';
                });
        } else {
            console.log("getUserMedia not supported");
            imageInput.style.display = 'block';
        }
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                document.getElementById('capture-photo').style.display = 'none';
            })
        }
    });

    document.getElementById('capture-photo').addEventListener('click', function () {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        imagePreview.src = canvas.toDataURL('image/png');
        imagePreview.style.display = 'block';
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        video.style.display = 'none';
    });

    imageInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const recipeName = document.getElementById("recipe-name").value;
        const recipeDescription = document.getElementById("recipe-description").value;
        const recipeImageSrc = imagePreview.src;

        if (!navigator.onLine) {
            saveRecipeOffline(recipeName, recipeDescription, recipeImageSrc);
            alert('You are offline. Your recipe will be saved and synced when you are back online.');
        } else {
            postRecipeOnline(recipeName, recipeDescription, recipeImageSrc);
        }

        form.reset();
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        video.style.display = 'none';
    });
});

function saveRecipeOffline(name, description, imageSrc) {
    const offlineRecipes = JSON.parse(localStorage.getItem('offlineRecipes')) || [];
    offlineRecipes.push({ name, description, imageSrc });
    localStorage.setItem('offlineRecipes', JSON.stringify(offlineRecipes));
}

async function postRecipeOnline(name, description, imageSrc) {
    try {
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, imageSrc })
        });

        if (response.ok) {
            const recipesList = document.getElementById("recipes-list");
            const recipeItem = document.createElement("div");
            recipeItem.classList.add("recipe-item");
            recipeItem.innerHTML = `<h3>${name}</h3><p>${description}</p>${imageSrc ? `<img src="${imageSrc}" alt="Recipe Image" style="max-width: 100%;">` : ''}`;
            recipesList.appendChild(recipeItem);
        } else {
            throw new Error('Network response was not ok.');
        }
    } catch (error) {
        console.error('Error posting recipe:', error);
    }
}
