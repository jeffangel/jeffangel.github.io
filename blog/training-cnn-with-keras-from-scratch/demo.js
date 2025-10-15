(function () {
    'use strict';

    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const results = document.getElementById('results');
    const ageResult = document.getElementById('ageResult');
    const genderResult = document.getElementById('genderResult');
    const modelStatus = document.getElementById('modelStatus');

    let selectedImage = null;
    let modelReady = false;

    // Función para despertar el contenedor de Hugging Face
    async function wakeUpHuggingFaceContainer() {
        // Mostrar indicador de carga
        showModelLoadingStatus();
        
        try {
            const response = await fetch(
                'https://jeffangel-demo-training-cnn-with-keras-from-scratch.hf.space/health/',
                {
                    method: 'GET',
                }
            );
            
            if (response.ok) {
                console.log('Health check exitoso - Contenedor listo');
                modelReady = true;
                showModelReadyStatus();
            } else {
                console.log('Health check respuesta no OK - Contenedor iniciando...');
                // Reintentar después de 3 segundos
                setTimeout(wakeUpHuggingFaceContainer, 3000);
            }
        } catch (error) {
            console.log('Health check error - Reintentando...', error);
            // Reintentar después de 3 segundos
            setTimeout(wakeUpHuggingFaceContainer, 3000);
        }
    }

    function showModelLoadingStatus() {
        if (!modelStatus) return;
        modelStatus.innerHTML = `
            <div class="flex items-center space-x-2 text-amber-600">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm font-medium">Modelo preparándose...</span>
            </div>
        `;
        modelStatus.classList.remove('hidden');
    }

    function showModelReadyStatus() {
        if (!modelStatus) return;
        modelStatus.innerHTML = `
            <div class="flex items-center space-x-2 text-green-600">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm font-medium">Modelo listo</span>
            </div>
        `;
        // Ocultar después de 3 segundos con una transición suave
        setTimeout(() => {
            if (modelStatus) {
                modelStatus.style.transition = 'opacity 0.5s ease-out';
                modelStatus.style.opacity = '0';
                setTimeout(() => {
                    modelStatus.classList.add('hidden');
                    modelStatus.style.opacity = '1';
                }, 500);
            }
        }, 3000);
    }

    function init() {
        setupDropZoneEvents();
        setupFileInputEvent();
        setupAnalyzeButtonEvent();
        // Despertar el contenedor al cargar la página
        wakeUpHuggingFaceContainer();
    }

    function setupDropZoneEvents() {
        dropZone.addEventListener('click', () => imageInput.click());
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('border-blue-500', 'bg-blue-50'));
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('border-blue-500', 'bg-blue-50'));
        });
        dropZone.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleImage(files[0]);
        });
    }

    function setupFileInputEvent() {
        imageInput.addEventListener('change', e => {
            if (e.target.files.length > 0) handleImage(e.target.files[0]);
        });
    }

    function setupAnalyzeButtonEvent() {
        analyzeBtn.addEventListener('click', analyzeImage);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleImage(file) {
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            alert('Por favor, selecciona una imagen en formato JPG o PNG');
            return;
        }

        selectedImage = file;
        const reader = new FileReader();

        reader.onload = e => {
            imagePreview.innerHTML = `
        <img src="${e.target.result}" 
             alt="Imagen cargada" 
             class="max-w-full max-h-[400px] rounded-lg shadow-md object-contain">
      `;
            analyzeBtn.disabled = false;
            results.classList.add('hidden');
        };

        reader.readAsDataURL(file);
    }

    async function analyzeImage() {
        if (!selectedImage) return;

        setButtonLoadingState();

        try {
            const formData = new FormData();
            formData.append('file', selectedImage);

            const response = await fetch(
                'https://jeffangel-demo-training-cnn-with-keras-from-scratch.hf.space/predict/',
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            const predictedAge = data.age;
            const predictedGender = data.gender === "female" ? 'Femenino' : 'Masculino';

            displayResults(predictedAge, predictedGender);

        } catch (error) {
            console.error('Error al analizar la imagen:', error);
            alert('Hubo un problema al procesar la imagen. Inténtalo nuevamente.');
        } finally {
            setButtonNormalState();
        }
    }

    function setButtonLoadingState() {
        analyzeBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Analizando...
    `;
        analyzeBtn.disabled = true;
    }

    function setButtonNormalState() {
        analyzeBtn.innerHTML = `Predecir nuevamente`;
        analyzeBtn.disabled = false;
    }

    function displayResults(age, gender) {
        ageResult.textContent = age + ' años';
        genderResult.textContent = gender;
        results.classList.remove('hidden');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
