/**
 * ChurnSense — Frontend Application Logic v3.0
 * ==============================================
 * General Purpose Churn Engine:
 *  ✓ Dynamic form generation from model schema
 *  ✓ Custom model training workflow
 *  ✓ Multi-model support (default + custom)
 *  ✓ JWT Authentication
 *  ✓ SHAP model explainability chart
 *  ✓ Risk level classification
 */

(() => {
    "use strict";

    const API_BASE = window.location.origin;

    // ─── DOM Helpers ───────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const sidebar       = $("#sidebar");
    const hamburger     = $("#hamburger-btn");
    const loadingOverlay = $("#loading-overlay");
    const loadingText   = $("#loading-text");
    const toastContainer = $("#toast-container");

    // ─── State ──────────────────────────────────
    let authToken = localStorage.getItem("churnsense_token");
    let currentUser = JSON.parse(localStorage.getItem("churnsense_user") || "null");
    let activeSchema = null;  // Current model's feature schema
    let activeModelType = "default";
    let trainFile = null;
    let analysisData = null;

    // ═══════════════════════════════════════════
    //  INIT — Inject setup section from template
    // ═══════════════════════════════════════════
    function injectSetupSection() {
        const template = $("#setup-section-template");
        if (template) {
            const content = template.content.cloneNode(true);
            $("#main-content").appendChild(content);
        }
    }
    injectSetupSection();

    // Re-query dynamic elements after injection 
    const navBtns  = $$(".nav-btn");
    const sections = $$(".content-section");

    // ═══════════════════════════════════════════
    //  AUTH STATE
    // ═══════════════════════════════════════════
    function getAuthHeaders() {
        const headers = { "Content-Type": "application/json" };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
        return headers;
    }

    function setAuth(token, user) {
        authToken = token;
        currentUser = user;
        localStorage.setItem("churnsense_token", token);
        localStorage.setItem("churnsense_user", JSON.stringify(user));
        updateAuthUI();
        loadSchema();  // Reload schema for the new user
    }

    function clearAuth() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem("churnsense_token");
        localStorage.removeItem("churnsense_user");
        updateAuthUI();
        loadSchema();  // Reload default schema
    }

    function updateAuthUI() {
        const loginBtn = $("#auth-login-btn");
        const userInfo = $("#user-info");

        if (currentUser) {
            loginBtn.classList.add("hidden");
            userInfo.classList.remove("hidden");
            $("#user-name").textContent = currentUser.username;
            $("#user-avatar").textContent = currentUser.username.charAt(0).toUpperCase();
            $("#user-org").textContent = currentUser.organization || "";
        } else {
            loginBtn.classList.remove("hidden");
            userInfo.classList.add("hidden");
        }
    }

    // ═══════════════════════════════════════════
    //  AUTH MODAL
    // ═══════════════════════════════════════════
    const authModal = $("#auth-modal");

    window.openAuthModal = function(tab = "login") {
        authModal.classList.remove("hidden");
        switchModalTab(tab);
    };

    function closeAuthModal() {
        authModal.classList.add("hidden");
    }

    function switchModalTab(tab) {
        $$(".modal-tab").forEach(t => t.classList.remove("active"));
        $(`.modal-tab[data-tab="${tab}"]`).classList.add("active");

        if (tab === "login") {
            $("#login-form").classList.remove("hidden");
            $("#register-form").classList.add("hidden");
        } else {
            $("#login-form").classList.add("hidden");
            $("#register-form").classList.remove("hidden");
        }
    }

    $$(".modal-tab").forEach(tab => {
        tab.addEventListener("click", () => switchModalTab(tab.dataset.tab));
    });

    $("#modal-close-btn").addEventListener("click", closeAuthModal);
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    $("#logout-btn").addEventListener("click", () => {
        clearAuth();
        showToast("Logged out successfully", "info");
    });

    // Login form
    $("#login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = $("#login-email").value;
        const password = $("#login-password").value;

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            setAuth(data.token, data.user);
            closeAuthModal();
            showToast(`Welcome back, ${data.user.username}!`, "success");
            loadDashboard();
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    // Register form
    $("#register-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = $("#reg-username").value;
        const email = $("#reg-email").value;
        const password = $("#reg-password").value;
        const organization = $("#reg-org").value || null;

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, organization }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");

            setAuth(data.token, data.user);
            closeAuthModal();
            showToast(`Account created! Welcome, ${data.user.username}!`, "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    // ═══════════════════════════════════════════
    //  NAVIGATION
    // ═══════════════════════════════════════════
    function switchSection(name) {
        sections.forEach(s => s.classList.remove("active"));
        navBtns.forEach(b => b.classList.remove("active"));

        const section = $(`#section-${name}`);
        const btn     = $(`[data-section="${name}"]`);
        if (section) section.classList.add("active");
        if (btn)     btn.classList.add("active");

        sidebar.classList.remove("open");

        if (name === "dashboard") loadDashboard();
        if (name === "history")   loadHistory();
        if (name === "setup")     loadSetupStatus();
    }

    navBtns.forEach(btn => {
        btn.addEventListener("click", () => switchSection(btn.dataset.section));
    });

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(e.target) &&
            !hamburger.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });

    // ═══════════════════════════════════════════
    //  TOAST NOTIFICATIONS
    // ═══════════════════════════════════════════
    function showToast(message, type = "info") {
        const icons = { success: "✅", error: "❌", info: "ℹ️" };
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || "ℹ️"}</span>
            <span class="toast-msg">${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;
        toastContainer.appendChild(toast);
        toast.querySelector(".toast-close").addEventListener("click", () => removeToast(toast));
        setTimeout(() => removeToast(toast), 5000);
    }

    function removeToast(toast) {
        if (!toast.parentNode) return;
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }

    // ═══════════════════════════════════════════
    //  LOADING OVERLAY
    // ═══════════════════════════════════════════
    function showLoading(text = "Analyzing…") {
        loadingText.textContent = text;
        loadingOverlay.classList.remove("hidden");
    }

    function hideLoading() {
        loadingOverlay.classList.add("hidden");
    }

    // ═══════════════════════════════════════════
    //  DYNAMIC SCHEMA & FORM GENERATION
    // ═══════════════════════════════════════════
    async function loadSchema() {
        try {
            const res = await fetch(`${API_BASE}/schema`, { headers: getAuthHeaders() });
            if (!res.ok) return;
            const data = await res.json();
            activeSchema = data;
            activeModelType = data.model_type;
            buildDynamicForm(data);
            updateModelIndicator(data);
        } catch (err) {
            console.warn("Schema load failed:", err);
        }
    }

    function buildDynamicForm(schema) {
        const grid = $("#dynamic-form-grid");
        if (!grid || !schema.features) return;

        grid.innerHTML = "";

        schema.features.forEach((feat, idx) => {
            const group = document.createElement("div");
            group.className = "form-group";

            const id = `inp-dyn-${idx}`;
            const label = document.createElement("label");
            label.setAttribute("for", id);
            label.textContent = formatFeatureName(feat.name);
            group.appendChild(label);

            if (feat.type === "categorical" && feat.categories) {
                const select = document.createElement("select");
                select.id = id;
                select.dataset.feature = feat.name;
                select.required = true;

                const placeholder = document.createElement("option");
                placeholder.value = "";
                placeholder.disabled = true;
                placeholder.selected = true;
                placeholder.textContent = `Select ${formatFeatureName(feat.name)}`;
                select.appendChild(placeholder);

                feat.categories.forEach(cat => {
                    const opt = document.createElement("option");
                    opt.value = cat;
                    
                    if (cat === "0" || cat === "1") {
                        const nameLower = feat.name.toLowerCase();
                        let label0 = "0 (No/False)";
                        let label1 = "1 (Yes/True)";

                        if (nameLower.includes("gender") || nameLower.includes("sex")) {
                            label0 = "Female";
                            label1 = "Male";
                        } else if (nameLower.includes("is") || nameLower.includes("has") || nameLower.includes("active")) {
                            label0 = "No";
                            label1 = "Yes";
                        }

                        opt.textContent = cat === "0" ? label0 : label1;
                    } else {
                        opt.textContent = cat;
                    }
                    
                    select.appendChild(opt);
                });

                group.appendChild(select);
            } else {
                const nameLower = feat.name.toLowerCase();
                const isCurrency = nameLower.includes("balance") || nameLower.includes("salary") || nameLower.includes("amount");
                const isInteger = nameLower.includes("age") || nameLower.includes("tenure") || nameLower.includes("product") || nameLower.includes("num");

                // Currency wrapper
                let inputContainer = group;
                if (isCurrency) {
                    inputContainer = document.createElement("div");
                    inputContainer.className = "flex w-full";
                    
                    const currSelect = document.createElement("select");
                    currSelect.className = "rounded-r-none border-r-0 bg-gray-800 text-text-primary px-3 py-2 outline-none focus:border-primary border border-border focus:ring-1 focus:ring-primary";
                    currSelect.id = `curr-${feat.name}`;
                    ['$', '₹', '€', '£'].forEach(sym => {
                        const opt = document.createElement("option");
                        opt.value = sym;
                        opt.textContent = sym;
                        currSelect.appendChild(opt);
                    });
                    inputContainer.appendChild(currSelect);
                }

                const input = document.createElement("input");
                input.type = "number";
                input.id = id;
                input.dataset.feature = feat.name;
                input.required = true;
                
                // Set step value
                input.step = isInteger ? "1" : "any";

                // Add styling specifically for the appended currency wrapper so it aligns smoothly
                if (isCurrency) {
                    input.className = "rounded-l-none w-full bg-surface text-text-primary border border-border px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary";
                } else {
                    input.className = "w-full";
                }

                if (feat.min !== undefined) input.min = feat.min;
                if (feat.max !== undefined) input.max = feat.max;

                // Configure intelligent placeholders
                if (nameLower.includes("tenure")) {
                    input.placeholder = `e.g. ${feat.mean || 5} (in months)`;
                } else if (isCurrency) {
                    input.placeholder = `e.g. ${feat.mean || 50000.00}`;
                } else if (feat.mean !== undefined) {
                    input.placeholder = `e.g. ${Math.round(feat.mean)}`;
                } else {
                    input.placeholder = `Enter ${formatFeatureName(feat.name).toLowerCase()}`;
                }

                inputContainer.appendChild(input);
                
                if (isCurrency) {
                    group.appendChild(inputContainer);
                }
            } // Close the '} else {' block

            grid.appendChild(group);
        });
    }

    function formatFeatureName(name) {
        return name
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    function updateModelIndicator(schema) {
        const indicator = $("#model-indicator");
        const badge = $("#model-badge");
        const subtitle = $("#predict-subtitle");
        if (!indicator || !badge) return;

        if (schema.model_type === "custom") {
            indicator.classList.remove("hidden");
            badge.textContent = `Custom Model (${(schema.accuracy * 100).toFixed(1)}% accuracy)`;
            badge.className = "model-badge custom";
            subtitle.textContent = `Using your custom model with ${schema.features.length} features`;
        } else {
            indicator.classList.remove("hidden");
            badge.textContent = "Default Banking Model";
            badge.className = "model-badge default";
            subtitle.textContent = "Enter customer details to predict churn likelihood";
        }
    }

    // ═══════════════════════════════════════════
    //  API STATUS CHECK
    // ═══════════════════════════════════════════
    async function checkAPI() {
        try {
            const res = await fetch(`${API_BASE}/api/health`);
            if (res.ok) {
                const data = await res.json();
                $(".sidebar-footer .status-dot").style.background = "var(--color-success)";
                let statusText = "API Connected";
                if (data.shap_available) statusText = "API + SHAP Ready";
                if (data.custom_models > 0) statusText += ` • ${data.custom_models} model(s)`;
                $(".sidebar-footer span:last-child").textContent = statusText;
            }
        } catch {
            $(".sidebar-footer .status-dot").style.background = "var(--color-danger)";
            $(".sidebar-footer span:last-child").textContent = "API Offline";
            showToast("Backend API is offline. Start the Flask server.", "error");
        }
    }

    // ═══════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════
    let pieChart = null;
    let trendChart = null;

    async function loadDashboard() {
        try {
            const res = await fetch(`${API_BASE}/stats`);
            if (!res.ok) throw new Error("Failed to fetch stats");
            const data = await res.json();

            animateValue("stat-total-val", data.total_predictions);
            animateValue("stat-churn-val", data.churn_count);
            animateValue("stat-stay-val",  data.stay_count);
            $("#stat-rate-val").textContent = data.churn_pct + "%";

            renderPieChart(data.churn_count, data.stay_count);

            if (data.trend && data.trend.length > 0) {
                renderTrendChart(data.trend.reverse());
            }

            loadRecentPredictions();
        } catch (err) {
            console.warn("Dashboard load error:", err);
        }
    }

    function animateValue(id, end) {
        const el = $(`#${id}`);
        const start = parseInt(el.textContent) || 0;
        const duration = 600;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (end - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function renderPieChart(churn, stay) {
        const ctx = $("#churnPieChart");
        if (pieChart) pieChart.destroy();

        pieChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Churn", "Stay"],
                datasets: [{
                    data: [churn || 0, stay || 0],
                    backgroundColor: ["rgba(239,68,68,0.8)", "rgba(34,197,94,0.8)"],
                    borderColor: ["rgba(239,68,68,1)", "rgba(34,197,94,1)"],
                    borderWidth: 1, hoverOffset: 8,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: "65%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#94a3b8", font: { family: "'Inter', sans-serif", size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 },
                    },
                },
            },
        });
    }

    function renderTrendChart(trend) {
        const ctx = $("#trendChart");
        if (trendChart) trendChart.destroy();

        trendChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: trend.map(t => t.date),
                datasets: [
                    {
                        label: "Churn", data: trend.map(t => t.churns),
                        borderColor: "rgba(239,68,68,0.8)", backgroundColor: "rgba(239,68,68,0.1)",
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
                    },
                    {
                        label: "Stay", data: trend.map(t => t.stays),
                        borderColor: "rgba(34,197,94,0.8)", backgroundColor: "rgba(34,197,94,0.1)",
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: "#64748b", font: { size: 11 } }, grid: { color: "rgba(255,255,255,0.04)" } },
                    y: { beginAtZero: true, ticks: { color: "#64748b", font: { size: 11 }, stepSize: 1 }, grid: { color: "rgba(255,255,255,0.04)" } },
                },
                plugins: { legend: { labels: { color: "#94a3b8", font: { family: "'Inter', sans-serif", size: 12 }, usePointStyle: true } } },
            },
        });
    }

    async function loadRecentPredictions() {
        try {
            const res = await fetch(`${API_BASE}/history?limit=8`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const tbody = $("#dashboard-recent-body");
            if (!data.length) {
                tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No predictions yet</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map(r => {
                const badge = r.prediction === "Churn"
                    ? `<span class="badge badge-churn">⚠ Churn</span>`
                    : `<span class="badge badge-stay">✓ Stay</span>`;
                const time = r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "—";
                return `<tr class="${r.prediction === 'Churn' && r.probability > 0.7 ? 'high-risk' : ''}">
                    <td>${time}</td>
                    <td>${r.age ?? '—'}</td>
                    <td>${r.tenure ?? '—'}</td>
                    <td>$${(r.balance ?? 0).toLocaleString()}</td>
                    <td>${badge}</td>
                    <td>${(r.probability * 100).toFixed(1)}%</td>
                </tr>`;
            }).join("");
        } catch { /* silent */ }
    }

    // ═══════════════════════════════════════════
    //  SHAP CHART
    // ═══════════════════════════════════════════
    let shapChart = null;

    function renderShapChart(explanation) {
        const shapSection = $("#shap-section");
        if (!explanation || explanation.length === 0) {
            shapSection.classList.add("hidden");
            return;
        }

        shapSection.classList.remove("hidden");
        const ctx = $("#shapChart");
        if (shapChart) shapChart.destroy();

        const top = explanation.slice(0, 10);

        shapChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: top.map(e => e.feature),
                datasets: [{
                    label: "Impact on Churn",
                    data: top.map(e => e.impact),
                    backgroundColor: top.map(e => e.impact > 0
                        ? "rgba(239,68,68,0.7)" : "rgba(34,197,94,0.7)"
                    ),
                    borderColor: top.map(e => e.impact > 0
                        ? "rgba(239,68,68,1)" : "rgba(34,197,94,1)"
                    ),
                    borderWidth: 1, borderRadius: 4,
                }],
            },
            options: {
                indexAxis: "y",
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: "#64748b", font: { size: 10 } },
                        grid: { color: "rgba(255,255,255,0.04)" },
                        title: { display: true, text: "← Decreases Churn | Increases Churn →", color: "#64748b", font: { size: 10 } },
                    },
                    y: {
                        ticks: { color: "#94a3b8", font: { size: 11 } },
                        grid: { display: false },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const item = top[ctx.dataIndex];
                                return `${item.impact > 0 ? '↑' : '↓'} ${Math.abs(item.impact).toFixed(4)} (value: ${item.value})`;
                            }
                        }
                    },
                },
            },
        });
    }

    // ═══════════════════════════════════════════
    //  RISK LEVEL HELPERS
    // ═══════════════════════════════════════════
    function getRiskBadgeClass(risk) {
        const map = { Low: "risk-low", Medium: "risk-medium", High: "risk-high", Critical: "risk-critical" };
        return map[risk] || "risk-low";
    }

    function getRiskBadgeHTML(risk) {
        return `<span class="badge badge-${getRiskBadgeClass(risk)}">${risk}</span>`;
    }

    // ═══════════════════════════════════════════
    //  MANUAL PREDICTION (DYNAMIC)
    // ═══════════════════════════════════════════
    const predictForm = $("#predict-form");
    const resultCard  = $("#result-card");

    predictForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Collect dynamic form values
        const fields = {};
        let valid = true;

        $$("#dynamic-form-grid [data-feature]").forEach(el => {
            el.classList.remove("invalid");
            const val = el.value;
            if (val === "" || val === null || val === undefined) {
                valid = false;
                el.classList.add("invalid");
            } else {
                fields[el.dataset.feature] = val;
            }
        });

        if (!valid) {
            showToast("Please fill in all fields", "error");
            return;
        }

        showLoading("Predicting churn likelihood…");

        try {
            const res = await fetch(`${API_BASE}/predict`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(fields),
            });

            if (!res.ok) {
                const err = await res.json();
                if (err.details && Array.isArray(err.details)) {
                    const msgs = err.details.map(d => d.msg || d).join(", ");
                    throw new Error(`Validation: ${msgs}`);
                }
                throw new Error(err.error || "Prediction failed");
            }

            const data = await res.json();
            displayPredictionResult(data);
            showToast(`Prediction: ${data.prediction} (${data.risk_level} risk)`, "success");
        } catch (err) {
            showToast(err.message || "Failed to connect to API", "error");
        } finally {
            hideLoading();
        }
    });

    function displayPredictionResult(data) {
        const isChurn = data.prediction === "Churn";
        const prob = data.probability;
        const pct  = (prob * 100).toFixed(1);
        const risk = data.risk_level || "Low";

        const iconEl = $("#result-icon");
        iconEl.className = `result-icon ${isChurn ? "churn" : "stay"}`;
        iconEl.textContent = isChurn ? "⚠️" : "✅";

        $("#result-title").textContent = isChurn
            ? "Customer is likely to Churn"
            : "Customer is likely to Stay";
        $("#result-title").style.color = isChurn ? "#f87171" : "#4ade80";

        const subtitles = {
            Critical: "Critical risk — immediate intervention required",
            High:     "High risk — consider retention strategies",
            Medium:   "Medium risk — monitor closely",
            Low:      "Low risk — customer appears satisfied",
        };
        $("#result-subtitle").textContent = subtitles[risk] || subtitles.Low;

        const riskBadge = $("#risk-badge");
        riskBadge.textContent = `${risk} Risk`;
        riskBadge.className = `risk-badge ${getRiskBadgeClass(risk)}`;

        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (prob * circumference);
        const ringFill = $("#ring-fill");
        ringFill.style.strokeDasharray = circumference;
        ringFill.style.strokeDashoffset = offset;

        const ringColors = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#22c55e" };
        ringFill.style.stroke = ringColors[risk] || "#22c55e";

        $("#ring-value").textContent = pct + "%";
        $("#ring-value").style.color = isChurn ? "#f87171" : "#4ade80";

        // Dynamic details display
        const f = data.features || {};
        const detailItems = Object.entries(f).map(([key, val]) => {
            let display = val;
            if (typeof val === "number" && val >= 1000) {
                display = "$" + Number(val).toLocaleString();
            }
            return `<div class="detail-item">
                <span class="detail-label">${formatFeatureName(key)}</span>
                <span class="detail-value">${display}</span>
            </div>`;
        }).join("");
        $("#result-details").innerHTML = detailItems;

        // Model type indicator
        if (data.model_type === "custom") {
            $("#result-details").innerHTML += `
                <div class="detail-item" style="grid-column: 1/-1; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem; margin-top: 0.5rem;">
                    <span class="detail-label">Model</span>
                    <span class="detail-value" style="color: var(--color-accent);">Custom Trained</span>
                </div>
            `;
        }

        renderShapChart(data.explanation);
        resultCard.classList.remove("hidden");
        resultCard.classList.add("show");
    }

    // ═══════════════════════════════════════════
    //  CSV BULK UPLOAD
    // ═══════════════════════════════════════════
    const uploadZone     = $("#upload-zone");
    const csvInput       = $("#csv-input");
    const fileInfo       = $("#file-info");
    const fileRemoveBtn  = $("#file-remove");
    const bulkPredictBtn = $("#bulk-predict-btn");
    const bulkSummary    = $("#bulk-summary");
    const bulkResultsCard = $("#bulk-results-card");

    let selectedFile = null;
    let bulkResults  = [];

    uploadZone.addEventListener("click", () => csvInput.click());
    uploadZone.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
    uploadZone.addEventListener("dragleave", () => { uploadZone.classList.remove("drag-over"); });
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    });
    csvInput.addEventListener("change", () => {
        if (csvInput.files[0]) handleFileSelect(csvInput.files[0]);
    });

    function handleFileSelect(file) {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            showToast("Please upload a .csv file", "error");
            return;
        }
        selectedFile = file;
        $("#file-name").textContent = file.name;
        $("#file-size").textContent = formatFileSize(file.size);
        uploadZone.classList.add("hidden");
        fileInfo.classList.remove("hidden");
        bulkPredictBtn.classList.remove("hidden");
        showToast(`File "${file.name}" selected`, "info");
    }

    fileRemoveBtn.addEventListener("click", resetUpload);

    function resetUpload() {
        selectedFile = null;
        csvInput.value = "";
        uploadZone.classList.remove("hidden");
        fileInfo.classList.add("hidden");
        bulkPredictBtn.classList.add("hidden");
        bulkSummary.classList.add("hidden");
        bulkResultsCard.classList.add("hidden");
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
    }

    bulkPredictBtn.addEventListener("click", async () => {
        if (!selectedFile) return;
        showLoading("Processing CSV file…");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const headers = {};
            if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

            const res = await fetch(`${API_BASE}/predict-bulk`, {
                method: "POST", headers, body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Bulk prediction failed");
            }

            const data = await res.json();
            bulkResults = data.results;

            $("#bulk-total").textContent   = data.total;
            $("#bulk-churn").textContent   = data.churn_count;
            $("#bulk-stay").textContent    = data.stay_count;
            $("#bulk-churn-pct").textContent = data.churn_pct + "%";
            $("#bulk-stay-pct").textContent  = data.stay_pct + "%";
            $("#bulk-churn-bar").style.width = data.churn_pct + "%";

            bulkSummary.classList.remove("hidden");
            renderBulkTable(bulkResults);
            bulkResultsCard.classList.remove("hidden");

            showToast(`Processed ${data.total} records successfully`, "success");
        } catch (err) {
            showToast(err.message || "Bulk prediction failed", "error");
        } finally {
            hideLoading();
        }
    });

    function renderBulkTable(results, filter = "all") {
        const tbody = $("#bulk-table-body");
        const filtered = filter === "all" ? results : results.filter(r => r.prediction === filter);

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="12" class="empty-msg">No records match filter</td></tr>`;
            return;
        }

        // Build dynamic column headers
        const keys = Object.keys(filtered[0]).filter(k => !["prediction", "probability", "risk_level", "explanation"].includes(k));
        const thead = $("#bulk-table thead");
        thead.innerHTML = `<tr>
            <th>#</th>
            ${keys.map(k => `<th>${formatFeatureName(k)}</th>`).join("")}
            <th>Result</th><th>Risk</th><th>Probability</th>
        </tr>`;

        tbody.innerHTML = filtered.map((r, i) => {
            const badge = r.prediction === "Churn"
                ? `<span class="badge badge-churn">⚠ Churn</span>`
                : `<span class="badge badge-stay">✓ Stay</span>`;
            const riskBadge = getRiskBadgeHTML(r.risk_level || "Low");
            const isHighRisk = r.prediction === "Churn" && r.probability > 0.7;
            return `<tr class="${isHighRisk ? 'high-risk' : ''}">
                <td>${i + 1}</td>
                ${keys.map(k => `<td>${r[k] ?? '—'}</td>`).join("")}
                <td>${badge}</td>
                <td>${riskBadge}</td>
                <td style="color:${isHighRisk ? '#f87171' : ''}">${(r.probability * 100).toFixed(1)}%</td>
            </tr>`;
        }).join("");
    }

    $$(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            $$(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderBulkTable(bulkResults, btn.dataset.filter);
        });
    });

    // Download CSV
    $("#download-csv-btn").addEventListener("click", () => {
        if (!bulkResults.length) {
            showToast("No results to download", "error");
            return;
        }

        const keys = Object.keys(bulkResults[0]).filter(k => !["explanation"].includes(k));
        const csvHeaders = [...keys];
        const rows = bulkResults.map(r => keys.map(k => r[k] ?? ""));

        const csv = [csvHeaders.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url;
        a.download = "churn_predictions.csv";
        a.click();
        URL.revokeObjectURL(url);
        showToast("CSV downloaded successfully", "success");
    });

    // ═══════════════════════════════════════════
    //  MODEL SETUP — Training Workflow
    // ═══════════════════════════════════════════
    function initSetupListeners() {
        const trainUploadZone = $("#train-upload-zone");
        const trainCsvInput   = $("#train-csv-input");
        const trainFileInfo   = $("#train-file-info");
        const analyzeBtn      = $("#analyze-btn");

        if (!trainUploadZone) return;  // Section not yet injected

        trainUploadZone.addEventListener("click", () => trainCsvInput.click());
        trainUploadZone.addEventListener("dragover", (e) => { e.preventDefault(); trainUploadZone.classList.add("drag-over"); });
        trainUploadZone.addEventListener("dragleave", () => trainUploadZone.classList.remove("drag-over"));
        trainUploadZone.addEventListener("drop", (e) => {
            e.preventDefault();
            trainUploadZone.classList.remove("drag-over");
            const file = e.dataTransfer.files[0];
            if (file) handleTrainFileSelect(file);
        });

        trainCsvInput.addEventListener("change", () => {
            if (trainCsvInput.files[0]) handleTrainFileSelect(trainCsvInput.files[0]);
        });

        $("#train-file-remove").addEventListener("click", resetTrainUpload);

        analyzeBtn.addEventListener("click", analyzeCSV);

        // Select/deselect all features
        $("#select-all-features").addEventListener("click", () => {
            $$("#feature-checkboxes input[type=checkbox]").forEach(cb => cb.checked = true);
        });
        $("#deselect-all-features").addEventListener("click", () => {
            $$("#feature-checkboxes input[type=checkbox]").forEach(cb => cb.checked = false);
        });

        // Train button
        $("#train-btn").addEventListener("click", trainCustomModel);

        // Load Sample Data
        const loadSampleBtn = $("#load-sample-btn");
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                showLoading("Fetching sample data...");
                try {
                    const res = await fetch(`${API_BASE}/api/sample-data`);
                    if (!res.ok) throw new Error("Could not load sample data");
                    const blob = await res.blob();
                    const file = new File([blob], "sample_data.csv", { type: "text/csv" });
                    handleTrainFileSelect(file);
                } catch (err) {
                    showToast(err.message, "error");
                } finally {
                    hideLoading();
                }
            });
        }

        // Post-training actions
        $("#use-model-btn").addEventListener("click", () => {
            switchSection("predict");
        });
        $("#retrain-btn").addEventListener("click", () => {
            resetTrainUpload();
            $("#setup-step-2").classList.add("hidden");
            $("#setup-step-3").classList.add("hidden");
        });
    }

    function handleTrainFileSelect(file) {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            showToast("Please upload a .csv file", "error");
            return;
        }
        trainFile = file;
        $("#train-file-name").textContent = file.name;
        $("#train-file-size").textContent = formatFileSize(file.size);
        $("#train-upload-zone").classList.add("hidden");
        $("#train-file-info").classList.remove("hidden");
        $("#analyze-btn").classList.remove("hidden");
    }

    function resetTrainUpload() {
        trainFile = null;
        analysisData = null;
        const trainCsvInput = $("#train-csv-input");
        if (trainCsvInput) trainCsvInput.value = "";
        const el = $("#train-upload-zone");
        if (el) el.classList.remove("hidden");
        const info = $("#train-file-info");
        if (info) info.classList.add("hidden");
        const btn = $("#analyze-btn");
        if (btn) btn.classList.add("hidden");
    }

    async function analyzeCSV() {
        if (!trainFile) return;
        showLoading("Analyzing CSV structure…");

        try {
            const formData = new FormData();
            formData.append("file", trainFile);
            formData.append("analyze_only", "true");

            const headers = {};
            if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

            const res = await fetch(`${API_BASE}/train`, {
                method: "POST", headers, body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Analysis failed");
            }

            analysisData = await res.json();
            showColumnMapping(analysisData);
            showToast(`Found ${analysisData.total_columns} columns in ${analysisData.total_rows} rows`, "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            hideLoading();
        }
    }

    function showColumnMapping(data) {
        const step2 = $("#setup-step-2");
        step2.classList.remove("hidden");

        // Data preview table
        if (data.preview && data.preview.length > 0) {
            const cols = Object.keys(data.preview[0]);
            $("#preview-thead").innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr>`;
            $("#preview-tbody").innerHTML = data.preview.map(row =>
                `<tr>${cols.map(c => `<td>${row[c] ?? ''}</td>`).join("")}</tr>`
            ).join("");
        }

        // Target column dropdown
        const targetSelect = $("#target-col-select");
        targetSelect.innerHTML = `<option value="" disabled selected>Select target column</option>`;
        data.columns.forEach(col => {
            const opt = document.createElement("option");
            opt.value = col.name;
            opt.textContent = `${col.name} (${col.unique_count} unique, ${col.suggested_type})`;
            targetSelect.appendChild(opt);
        });

        // Feature checkboxes
        const checkboxContainer = $("#feature-checkboxes");
        checkboxContainer.innerHTML = "";
        data.columns.forEach(col => {
            const div = document.createElement("label");
            div.className = "feature-checkbox";
            div.innerHTML = `
                <input type="checkbox" value="${col.name}" checked>
                <span class="checkbox-label">
                    <strong>${col.name}</strong>
                    <small>${col.suggested_type} • ${col.unique_count} unique • ${col.null_pct}% null</small>
                </span>
            `;
            checkboxContainer.appendChild(div);
        });

        // When target is selected, uncheck it from features
        targetSelect.addEventListener("change", () => {
            const target = targetSelect.value;
            $$("#feature-checkboxes input[type=checkbox]").forEach(cb => {
                if (cb.value === target) {
                    cb.checked = false;
                    cb.closest(".feature-checkbox").classList.add("disabled-target");
                } else {
                    cb.closest(".feature-checkbox").classList.remove("disabled-target");
                }
            });
        });

        step2.scrollIntoView({ behavior: "smooth" });
    }

    async function trainCustomModel() {
        const targetCol = $("#target-col-select").value;
        if (!targetCol) {
            showToast("Please select a target column", "error");
            return;
        }

        const featureCols = [];
        $$("#feature-checkboxes input[type=checkbox]:checked").forEach(cb => {
            if (cb.value !== targetCol) featureCols.push(cb.value);
        });

        if (featureCols.length === 0) {
            showToast("Please select at least one feature column", "error");
            return;
        }

        showLoading("Training your custom model… This may take a moment.");

        try {
            const formData = new FormData();
            formData.append("file", trainFile);
            formData.append("target_col", targetCol);
            formData.append("feature_cols", featureCols.join(","));

            const headers = {};
            if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

            const res = await fetch(`${API_BASE}/train`, {
                method: "POST", headers, body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Training failed");
            }

            const result = await res.json();
            showTrainingResults(result);

            // Reload the schema so the Predict page uses the new model
            await loadSchema();

            showToast("🎉 Custom model trained successfully!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            hideLoading();
        }
    }

    function showTrainingResults(result) {
        const step3 = $("#setup-step-3");
        step3.classList.remove("hidden");

        const warnings = result.warnings?.length
            ? `<div class="training-warnings">${result.warnings.map(w => `<div class="warning-item">⚠️ ${w}</div>`).join("")}</div>`
            : "";

        const importanceChart = result.feature_importance?.slice(0, 8).map(fi => {
            const pct = (fi.importance * 100).toFixed(0);
            return `<div class="importance-row">
                <span class="importance-name">${fi.feature}</span>
                <div class="importance-bar-container">
                    <div class="importance-bar" style="width: ${pct}%"></div>
                </div>
                <span class="importance-value">${(fi.importance * 100).toFixed(1)}%</span>
            </div>`;
        }).join("") || "";

        $("#training-results").innerHTML = `
            ${warnings}
            <div class="stat-cards">
                <div class="stat-card">
                    <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                    <div class="stat-info"><span class="stat-value">${(result.accuracy * 100).toFixed(1)}%</span><span class="stat-label">Accuracy</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
                    <div class="stat-info"><span class="stat-value">${result.auc ? (result.auc * 100).toFixed(1) + '%' : '—'}</span><span class="stat-label">AUC Score</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
                    <div class="stat-info"><span class="stat-value">${result.total_rows.toLocaleString()}</span><span class="stat-label">Training Rows</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div>
                    <div class="stat-info"><span class="stat-value">${result.churn_rate}%</span><span class="stat-label">Churn Rate</span></div>
                </div>
            </div>
            ${importanceChart ? `<div class="glass-card" style="margin-top: 1.5rem;"><h3>Feature Importance</h3><div class="importance-chart">${importanceChart}</div></div>` : ""}
        `;

        step3.scrollIntoView({ behavior: "smooth" });
    }

    async function loadSetupStatus() {
        try {
            const res = await fetch(`${API_BASE}/schema`, { headers: getAuthHeaders() });
            if (!res.ok) return;
            const data = await res.json();

            const typeEl = $("#setup-model-type");
            const accEl  = $("#setup-accuracy");
            const featEl = $("#setup-features-count");
            const rowsEl = $("#setup-data-rows");
            const trainEl = $("#setup-trained-at");

            if (data.model_type === "custom") {
                typeEl.textContent = "Custom Model";
                typeEl.classList.add("custom");
                accEl.textContent = data.accuracy ? (data.accuracy * 100).toFixed(1) + "%" : "—";
                featEl.textContent = data.features?.length || "—";
                rowsEl.textContent = data.dataset_rows?.toLocaleString() || "—";
                trainEl.textContent = data.trained_at ? new Date(data.trained_at).toLocaleDateString() : "—";
            } else {
                typeEl.textContent = "Default (Banking)";
                typeEl.classList.remove("custom");
                accEl.textContent = "~85%";
                featEl.textContent = "8";
                rowsEl.textContent = "12,000";
                trainEl.textContent = "Pre-trained";
            }
        } catch { /* silent */ }
    }

    // ═══════════════════════════════════════════
    //  HISTORY
    // ═══════════════════════════════════════════
    async function loadHistory() {
        try {
            const res = await fetch(`${API_BASE}/history?limit=100`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const tbody = $("#history-table-body");
            if (!data.length) {
                tbody.innerHTML = `<tr><td colspan="10" class="empty-msg">No prediction history</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map(r => {
                const badge = r.prediction === "Churn"
                    ? `<span class="badge badge-churn">⚠ Churn</span>`
                    : `<span class="badge badge-stay">✓ Stay</span>`;
                const srcBadge = r.source === "csv"
                    ? `<span class="badge badge-csv">CSV</span>`
                    : `<span class="badge badge-manual">Manual</span>`;
                const time = r.timestamp ? new Date(r.timestamp).toLocaleString() : "—";
                return `<tr class="${r.prediction === 'Churn' && r.probability > 0.7 ? 'high-risk' : ''}">
                    <td>${r.id}</td>
                    <td>${time}</td>
                    <td>${r.gender == 1 ? "Male" : "Female"}</td>
                    <td>${r.age ?? '—'}</td>
                    <td>${r.tenure ?? '—'}</td>
                    <td>$${(r.balance ?? 0).toLocaleString()}</td>
                    <td>${r.num_products ?? '—'}</td>
                    <td>${badge}</td>
                    <td>${(r.probability * 100).toFixed(1)}%</td>
                    <td>${srcBadge}</td>
                </tr>`;
            }).join("");
        } catch {
            $("#history-table-body").innerHTML = `<tr><td colspan="10" class="empty-msg">Failed to load history</td></tr>`;
        }
    }

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════
    updateAuthUI();
    checkAPI();
    loadSchema();
    loadDashboard();
    initSetupListeners();

})();
