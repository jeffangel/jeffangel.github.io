(function () {
    'use strict';
    /*************************************************
     * demo.js
     * -----------------------------------------------
     * Backend:
     *   - Calcula eta y prob
     *
     * Frontend:
     *   - Solicita datos
     *   - Muestra resultados
     *   - Aplica regla de decisión p >= τ
     *************************************************/

    /* ============================
       Estado global
    ============================ */
    let currentSample = null;
    let currentResult = null;
    let currentThreshold = 0.5;
    let endpoint = "https://jeffangel-demo-logistic-regression-no-black-box.hf.space/";
    let predict_url = endpoint + "predict/";
    let sample_url = endpoint + "sample/";
    const modelStatus = document.getElementById('modelStatus');
    let modelReady = false;

    /* ============================
       Cargar muestra
    ============================ */
    document.getElementById("loadSampleBtn").addEventListener("click", async () => {
        try {
            const res = await fetch(sample_url);
            if (!res.ok) throw new Error("Error al obtener la muestra");

            const payload = await res.json();
            currentSample = payload.sample;

            // Mostrar clase real
            document.getElementById("trueClass").textContent =
                currentSample.class;

            // Mostrar vector de entrada
            document.getElementById("sampleVector").textContent =
                JSON.stringify(currentSample.data, null, 2);

            // Mostrar panel
            document.getElementById("sampleBox").classList.remove("hidden");

            // Habilitar inferencia
            document.getElementById("predictBtn").disabled = false;

        } catch (err) {
            console.error(err);
            alert("No se pudo cargar la muestra desde el backend.");
        }
    });

    /* ============================
       Ejecutar inferencia
    ============================ */
    document.getElementById("predictBtn").addEventListener("click", async () => {
        if (!currentSample) return;

        try {
            const res = await fetch(predict_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentSample.data)
            });

            if (!res.ok) throw new Error("Error en inferencia");

            currentResult = await res.json();

            renderResults(currentResult);

        } catch (err) {
            console.error(err);
            alert("Error al ejecutar la inferencia.");
        }
    });

    /* ============================
       Slider de umbral (τ)
    ============================ */
    document.getElementById("thresholdInput").addEventListener("input", (e) => {
        currentThreshold = parseFloat(e.target.value);

        document.getElementById("thresholdValue").textContent =
            currentThreshold.toFixed(2);

        updateDecision();
    });

    /* ============================
       Render de resultados
    ============================ */
    function renderResults(result) {
        /*
          Formato esperado:
          {
            newton: { eta, prob },
            gradient_descent: { eta, prob },
            gradient_descent_backtracking: { eta, prob }
          }
        */

        currentResult = result;

        // Mostrar panel
        document.getElementById("results").classList.remove("hidden");

        ["newton", "gradient_descent", "gradient_descent_backtracking"].forEach(opt => {
            const r = result[opt];

            // Nivel 1: eta
            document.getElementById(`eta-${opt}`).textContent =
                r.eta.toFixed(6);

            // Nivel 2: probabilidad
            document.getElementById(`prob-${opt}`).textContent =
                r.prob.toFixed(6);

            document.getElementById(`probBar-${opt}`).style.width =
                `${Math.min(100, Math.max(0, r.prob * 100))}%`;
        });

        // Decisión inicial con τ actual
        updateDecision();
    }

    function labelFromClass(y) {
        return y === 0
            ? "Buen pagador"
            : "Riesgo alto de crédito";
    }


    /* ============================
       Regla de decisión (frontend)
    ============================ */
    function updateDecision() {
        if (!currentResult) return;

        ["newton", "gradient_descent", "gradient_descent_backtracking"].forEach(opt => {
            const p = currentResult[opt].prob;
            const predictedClass = p >= currentThreshold ? 1 : 0;

            document.getElementById(`class-${opt}`).textContent =
                `${labelFromClass(predictedClass)} (y = ${predictedClass})`;
        });
    }

    // Function to wake up the Hugging Face container
    async function wakeUpHuggingFaceContainer() {
        // Show loading indicator
        showModelLoadingStatus();

        try {
            const response = await fetch(
                'https://jeffangel-demo-training-cnn-with-keras-from-scratch.hf.space/health/',
                {
                    method: 'GET',
                }
            );

            if (response.ok) {
                console.log('Health check successful - Container ready');
                modelReady = true;
                showModelReadyStatus();
            } else {
                console.log('Health check response not OK - Container starting...');
                // Retry after 3 seconds
                setTimeout(wakeUpHuggingFaceContainer, 3000);
            }
        } catch (error) {
            console.log('Health check error - Retrying...', error);
            // Retry after 3 seconds
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
                <span class="text-sm font-medium">Model warming up...</span>
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
                <span class="text-sm font-medium">Model ready</span>
            </div>
        `;
        // Hide after 3 seconds with a smooth transition
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
        // Wake up the container when the page loads
        wakeUpHuggingFaceContainer();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();