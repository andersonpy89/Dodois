// =========================
// CONFIGURAÇÕES FIXAS
// =========================

const categories = [
  "Alimentação","Aluguel","Beleza","Carro","Casa","Container","Cozinha",
  "Gasolina","Etanol","Estudos","Lazer","Limpeza","Mercado","Moto",
  "Outros","Pets","Saúde","Tabaco","Transporte","Vestuário",
  "Viagem","Salário","Extras"
]

const categoryColors = {
  "Alimentação":"#ef4444",
  "Aluguel":"#6366f1",
  "Beleza":"#f472b6",
  "Carro":"#0ea5e9",
  "Casa":"#22c55e",
  "Container":"#f59e0b",
  "Cozinha":"#84cc16",
  "Gasolina":"#fb923c",
  "Etanol":"#facc15",
  "Estudos":"#8b5cf6",
  "Lazer":"#ec4899",
  "Limpeza":"#14b8a6",
  "Mercado":"#10b981",
  "Moto":"#06b6d4",
  "Outros":"#94a3b8",
  "Pets":"#f97316",
  "Saúde":"#ef4444",
  "Tabaco":"#64748b",
  "Transporte":"#0ea5e9",
  "Vestuário":"#a855f7",
  "Viagem":"#22c55e",
  "Salário":"#16a34a",
  "Extras":"#f59e0b"
}

const cards = ["NU","XP","Dinheiro","Déb Itau","Déb NU","Pix"]

const app = document.getElementById("app")

let categoryChart
let cardChart
let balanceChart
let incomeExpenseChart
let chartCategories = null
let chartCards = null
let chartBalance = null
let chartIncomeExpense = null
let unsubscribe = null
let currentUser = null
let isEditing = false

function resetEditingState() {
  isEditing = false
}

const now = new Date()
let selectedMonth = now.getMonth() + 1
let selectedYear = now.getFullYear()

// =========================
// DASHBOARD
// =========================
function updateDashboard(totalEntradas, totalSaidas, saldo) {
  document.getElementById("dash-entradas").textContent = formatCurrency(totalEntradas)
  document.getElementById("dash-saidas").textContent = formatCurrency(totalSaidas)
  document.getElementById("dash-saldo").textContent = formatCurrency(saldo)
}

function updateDashboardCardsAndInsights({ totalEntradas, totalSaidas, saldo, categoryTotals, cardTotals, userTotals }) {
  updateDashboard(totalEntradas, totalSaidas, saldo)
  updateInsights(categoryTotals, cardTotals, userTotals)
}

// =========================
// LOGIN
// =========================

function renderLogin() {
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1>🦤 Dodô</h1>
        <button id="login-btn">Entrar com Google</button>
      </div>
    </div>
  `

  document.getElementById("login-btn").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    auth.signInWithPopup(provider)
  }
}

function showRecurrenceModal() {

  return new Promise((resolve) => {

    const overlay = document.getElementById("recurrence-modal-overlay")
    const confirmBtn = document.getElementById("recurrence-confirm")
    const cancelBtn = document.getElementById("recurrence-cancel")

    if (!overlay) {
      resolve("single")
      return
    }

    overlay.style.display = "flex"

    confirmBtn.onclick = () => {
      const selected = document.querySelector('input[name="recurrence-option"]:checked')
      overlay.style.display = "none"
      resolve(selected ? selected.value : "single")
    }

    cancelBtn.onclick = () => {
      overlay.style.display = "none"
      resolve("cancel")
    }

  })

}

// =========================
// APP PRINCIPAL
// =========================

function renderApp(user) {
  currentUser = user

  app.innerHTML = `
    <div class="topbar">
      <div>🦤 Dodô</div>
      <div>
        ${user.displayName}
        <button id="logout-btn">Sair</button>
      </div>
    </div>
    
    <div class="month-selector">
      <button id="prev-month">◀</button>
      <span id="current-month"></span>
      <button id="next-month">▶</button>
    </div>

    <div class="monthly-summary">
      <div id="monthly-entradas">Entradas: R$ 0,00</div>
      <div id="monthly-saidas">Saídas: R$ 0,00</div>
      <div id="monthly-saldo">Saldo: R$ 0,00</div>
    </div> 

    <button id="toggle-annual">Ver resumo anual</button>

    <div id="annual-summary" style="display: none;">
      <div id="annual-total"></div>
      <div id="annual-average"></div>
      <div id="annual-best"></div>
      <div id="annual-worst"></div>
    </div>

    <div class="main">

      <div class="transaction-form">

        <select id="type">
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>

        <select id="transaction-mode">
          <option value="normal">Normal</option>
          <option value="recorrente">Recorrente</option>
          <option value="parcelado">Parcelado</option>
        </select>

        <div id="installments-container" style="display: none;">
          <input 
            type="number" 
            id="installments" 
            min="1" 
            placeholder="Qtd. Parcelas"
          >
        </div>

        <input type="date" id="date">
        <input type="text" id="description" placeholder="Descrição">

        <select id="category">
          <option value="">Categoria</option>
          ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
        </select>

        <select id="card">
          <option value="">Forma de Pagamento</option>
          ${cards.map(card => `<option value="${card}">${card}</option>`).join("")}
        </select>

        <input type="text" id="amount" placeholder="0,00">
        <button id="save-btn">Salvar</button>

      </div>

      <section class="collapsible">

        <div class="collapsible-header">
          <span>Transações</span>
          <span class="arrow">▼</span>
        </div>

        <div class="collapsible-body">
          <div id="transactions-list"></div>
        </div>

      </section>

    </div>

    <hr>

    <section class="collapsible">

      <div class="collapsible-header">
        <span>Dashboard</span>
        <span class="arrow">▼</span>
      </div>

      <div class="collapsible-body">

        <div>
          <label>Período: </label>
          <select id="dashboard-period">
            <option value="monthly">Mensal</option>
            <option value="annual">Anual</option>
          </select>
        </div>

        <div class="dashboard">    
          <div class="summary-cards">
            <div class="card-box">
              <h4>Total Entradas</h4>
              <p id="dash-entradas">R$ 0,00</p>
            </div>

            <div class="card-box">
              <h4>Total Saídas</h4>
              <p id="dash-saidas">R$ 0,00</p>
            </div>

            <div class="card-box">
              <h4>Saldo</h4>
              <p id="dash-saldo">R$ 0,00</p>
            </div>
          </div>

          <div class="insights">
            <p id="top-category"></p>
            <p id="top-card"></p>
            <p id="top-user"></p>
          </div>

          <div class="dashboard-charts">
            <div class="chart-card">
              <h4>Gastos por Categoria</h4>
              <canvas id="chart-categories"></canvas>
            </div>

            <div class="chart-card">
              <h4>Gastos por Forma de Pagamento</h4>
              <canvas id="chart-cards"></canvas>
            </div>

            <div class="chart-card">
              <h4>Evolução do Saldo</h4>
              <canvas id="chart-balance"></canvas>
            </div>

            <div class="chart-card">
              <h4>Entradas vs Saídas</h4>
              <canvas id="chart-income-expense"></canvas>
            </div>
          </div>

        </div>

      </div>

    </section>
    `

  // --- CONFIGURAÇÕES INICIAIS ---
  document.getElementById("date").value = formatDateLocal(new Date())

  document.getElementById("logout-btn").onclick = () => {
    if (unsubscribe) unsubscribe()
    auth.signOut()
  }

  document.getElementById("prev-month").onclick = async () => {
    resetEditingState() // continua aqui
    selectedMonth--
    if (selectedMonth < 1) {
      selectedMonth = 12
      selectedYear--
    }
    startListener()
    await syncAnnualIfNeeded()
  }

  document.getElementById("next-month").onclick = async () => {
  resetEditingState()
  selectedMonth++
  if (selectedMonth > 12) {
    selectedMonth = 1
    selectedYear++
  }
  startListener()
  await syncAnnualIfNeeded()
}

  document.getElementById("toggle-annual").onclick = async () => {
  const section = document.getElementById("annual-summary")

  section.style.display =
    section.style.display === "none" ? "block" : "none"

  if (section.style.display === "block") {
    await calculateAnnualSummary()
  }
}

  document.getElementById("save-btn").onclick = saveTransaction

 
  // --- MOSTRAR CAMPO DE PARCELAS ---
  const modeSelect = document.getElementById("transaction-mode")
  const installmentsContainer = document.getElementById("installments-container")
  modeSelect.addEventListener("change", () => {
    if (modeSelect.value === "parcelado") {
      installmentsContainer.style.display = "block"
    } else {
      installmentsContainer.style.display = "none"
      document.getElementById("installments").value = ""
    }
  })

  // --- SWITCH DASHBOARD MENSAL / ANUAL ---
  document.getElementById("dashboard-period").onchange = async (e) => {
    const value = e.target.value

    if (value === "monthly") {
      startListener() // recalcula mensal e dashboard mensal
    }

    if (value === "annual") {
      await updateAnnualDashboard() // recalcula só dashboard anual
    }
  }

  // --- GARANTIR RECORRÊNCIAS ---
  ensureRecurringForYear(selectedYear)

  // --- INICIALIZA LISTENER ---
  startListener()

  document.querySelectorAll(".collapsible-header").forEach(header => {

    header.onclick = () => {

      const section = header.parentElement
      section.classList.toggle("open")

    }

  })
}

function updateCharts(transactions){

  if(!Array.isArray(transactions) || transactions.length === 0) return

  const ctx1 = document.getElementById("chart-categories")
  if (!ctx1) return 

  const categoryTotals = {}
  const cardTotals = {}
  const monthlyBalance = {}
  let totalEntradas = 0
  let totalSaidas = 0

  transactions.forEach(t => {

    if(t.type === "entrada"){
      totalEntradas += t.amount
    }else{
      totalSaidas += t.amount
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
      cardTotals[t.card] = (cardTotals[t.card] || 0) + t.amount
    }

    monthlyBalance[t.month] =
      (monthlyBalance[t.month] || 0) +
      (t.type === "entrada" ? t.amount : -t.amount)

  })

  // =========================
  // GRÁFICO CATEGORIAS
  // =========================

  const categoryLabels = Object.keys(categoryTotals)
  const categoryValues = Object.values(categoryTotals)

  const colors = categoryLabels.map(cat => categoryColors[cat] || "#888")

  if(categoryChart) categoryChart.destroy()

  categoryChart = new Chart(ctx1,{
    type:"doughnut",
    data:{
      labels:categoryLabels,
      datasets:[{
        data:categoryValues,
        backgroundColor:colors
      }]
    },
    options:{
      responsive:true,
      plugins:{
        tooltip:{
          callbacks:{
            label:(ctx)=>{
              return "R$ " + ctx.raw.toFixed(2).replace(".",",")
            }
          }
        }
      }
    }
  })

  // =========================
  // GRÁFICO CARTÕES
  // =========================

  const cardLabels = Object.keys(cardTotals)
  const cardValues = Object.values(cardTotals)

  if(cardChart) cardChart.destroy()

  const ctx2 = document.getElementById("chart-cards")
  if (!ctx1) return 
  
  cardChart = new Chart(ctx2,{
    type:"pie",
    data:{
      labels:cardLabels,
      datasets:[{
        data:cardValues
      }]
    },
    options:{
      responsive:true,
      plugins:{
        tooltip:{
          callbacks:{
            label:(ctx)=>{
              return "R$ " + ctx.raw.toFixed(2).replace(".",",")
            }
          }
        }
      }
    }
  })

  // =========================
  // GRÁFICO SALDO MENSAL
  // =========================

  const months = Object.keys(monthlyBalance).sort((a,b)=>a-b)
  const balances = months.map(m => monthlyBalance[m])

  if(balanceChart) balanceChart.destroy()

  const ctx3 = document.getElementById("chart-balance")
  if (!ctx1) return 

  balanceChart = new Chart(ctx3,{
    type:"line",
    data:{
      labels:months,
      datasets:[{
        label:"Saldo",
        data:balances,
        tension:0.3
      }]
    },
    options:{
      responsive:true,
      plugins:{
        tooltip:{
          callbacks:{
            label:(ctx)=>{
              return "R$ " + ctx.raw.toFixed(2).replace(".",",")
            }
          }
        }
      }
    }
  })

  // =========================
  // ENTRADAS VS SAÍDAS
  // =========================

  if(incomeExpenseChart) incomeExpenseChart.destroy()

  const ctx4 = document.getElementById("chart-income-expense")
  if (!ctx1) return 

  incomeExpenseChart = new Chart(ctx4,{
    type:"bar",
    data:{
      labels:["Entradas","Saídas"],
      datasets:[{
        data:[totalEntradas,totalSaidas]
      }]
    },
    options:{
      responsive:true,
      plugins:{
        tooltip:{
          callbacks:{
            label:(ctx)=>{
              return "R$ " + ctx.raw.toFixed(2).replace(".",",")
            }
          }
        }
      }
    }
  })

}

async function syncAnnualIfNeeded() {

  const periodSelect = document.getElementById("dashboard-period")
  const annualSection = document.getElementById("annual-summary")

  // 🔹 Se dashboard estiver em anual
  if (periodSelect && periodSelect.value === "annual") {
    await updateAnnualDashboard()
  }

  // 🔹 Se resumo anual estiver visível
  if (annualSection && annualSection.style.display === "block") {
    await calculateAnnualSummary()
  }
}

// =========================
// UTIL
// =========================

function formatDateLocal(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, "0")
  const d = String(dateObj.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function updateMonthLabel() {

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ]

  const label = document.getElementById("current-month")
  if (!label) return

  label.textContent = `${monthNames[selectedMonth - 1]} / ${selectedYear}`
}

function createSafeDate(year, month, day) {
  const lastDay = new Date(year, month, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  return formatDateLocal(new Date(year, month - 1, safeDay))
}

function formatCurrency(value) {
  return "R$ " + value.toFixed(2).replace(".", ",")
}

// =========================
// CALCULA TOTALS (reutilizável)
// =========================

function calculateTotals(transactions) {
  let totalEntradas = 0
  let totalSaidas = 0
  let categoryTotals = {}
  let cardTotals = {}
  let userTotals = {}

  transactions.forEach(data => {
    if (data.type === "entrada") {
      totalEntradas += data.amount
    } else {
      totalSaidas += data.amount
      categoryTotals[data.category] = (categoryTotals[data.category] || 0) + data.amount
      cardTotals[data.card] = (cardTotals[data.card] || 0) + data.amount
      userTotals[data.userName] = (userTotals[data.userName] || 0) + data.amount
    }
  })

  const saldo = totalEntradas - totalSaidas

  return { totalEntradas, totalSaidas, saldo, categoryTotals, cardTotals, userTotals }
}

function resetTransactionForm() {

  const description = document.getElementById("description")
  const amount = document.getElementById("amount")
  const category = document.getElementById("category")
  const card = document.getElementById("card")
  const installments = document.getElementById("installments")
  const date = document.getElementById("date")

  if (description) description.value = ""
  if (amount) amount.value = ""
  if (category) category.selectedIndex = 0
  if (card) card.selectedIndex = 0
  if (installments) installments.value = 1
  if (date) date.value = formatDateLocal(new Date())
}

// =========================
// SALVAR
// =========================

async function saveTransaction() {

  const type = document.getElementById("type").value
  const mode = document.getElementById("transaction-mode").value
  const description = document.getElementById("description").value
  const category = document.getElementById("category").value
  const card = document.getElementById("card").value
  const dateInput = document.getElementById("date").value
  let amountInput = document.getElementById("amount").value

  if (!description || !amountInput || !dateInput) {
    alert("Preencha todos os campos")
    return
  }

  amountInput = amountInput.replace(",", ".")
  const amount = Number(amountInput)

  if (isNaN(amount)) {
    alert("Valor inválido")
    return
  }

  const [year, month, day] = dateInput.split("-").map(Number)

  if (mode === "recorrente") {

    const recurrenceId = "rec_" + Date.now()

    for (let m = month; m <= 12; m++) {

      const safeDate = createSafeDate(year, m, day)

      await db.collection("transactions").add({
        userId: currentUser.uid,
        userName: currentUser.displayName,
        type,
        mode: "recorrente",
        recurrenceId,
        recurringDay: day,
        installmentId: null,
        installmentNumber: null,
        totalInstallments: null,
        description,
        category,
        card,
        amount,
        date: safeDate,
        month: m,
        year,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    }

  } else if (mode === "parcelado") {

    const totalInstallments = Number(document.getElementById("installments").value)

    if (!totalInstallments || totalInstallments < 1) {
      alert("Informe a quantidade de parcelas")
      return
    }

    const installmentId = "inst_" + Date.now()

    const baseValue = Math.floor((amount / totalInstallments) * 100) / 100
    let accumulated = 0

    for (let i = 1; i <= totalInstallments; i++) {

      const calcMonth = month + (i - 1)
      const calcYear = year + Math.floor((calcMonth - 1) / 12)
      const realMonth = ((calcMonth - 1) % 12) + 1

      const safeDate = createSafeDate(calcYear, realMonth, day)

      let installmentValue = baseValue
      accumulated += baseValue

      if (i === totalInstallments) {
        installmentValue = Number((amount - (baseValue * (totalInstallments - 1))).toFixed(2))
      }

      await db.collection("transactions").add({
        userId: currentUser.uid,
        userName: currentUser.displayName,
        type,
        mode: "parcelado",
        recurrenceId: null,
        recurringDay: null,
        installmentId,
        installmentNumber: i,
        totalInstallments,
        description,
        category,
        card,
        amount: installmentValue,
        date: safeDate,
        month: realMonth,
        year: calcYear,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    }

  } else {

    await db.collection("transactions").add({
      userId: currentUser.uid,
      userName: currentUser.displayName,
      type,
      mode: "normal",
      recurrenceId: null,
      recurringDay: null,
      installmentId: null,
      installmentNumber: null,
      totalInstallments: null,
      description,
      category,
      card,
      amount,
      date: dateInput,
      month,
      year,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  }

  document.getElementById("description").value = ""
  document.getElementById("amount").value = ""
  document.getElementById("category").selectedIndex = 0
  document.getElementById("card").selectedIndex = 0
  document.getElementById("installments").value = 1
  document.getElementById("date").value = formatDateLocal(new Date())
  document.getElementById("description")?.focus()
  resetTransactionForm()
}

// =========================
// LISTENER (MENSAL)
// =========================

function startListener() {

  if (!currentUser) return
  if (unsubscribe) unsubscribe()

  resetEditingState()

  unsubscribe = db.collection("transactions")
    .where("userId", "==", currentUser.uid)
    .where("month", "==", selectedMonth)
    .where("year", "==", selectedYear)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      updateMonthLabel()

      const list = document.getElementById("transactions-list")
      if (!list) return
      list.innerHTML = ""

      snapshot.docs.forEach(doc => {
        const data = doc.data()
        const item = document.createElement("div")
        item.className = "transaction-item"

        let badgeHTML = ""
        if (data.recurrenceId) badgeHTML = `<span class="badge badge-recorrente">🔁</span>`
        if (data.installmentId) badgeHTML = `<span class="badge badge-parcelado">${data.installmentNumber}/${data.totalInstallments}</span>`

        item.innerHTML = `
          <div class="transaction-row">
            <span>${data.description} ${badgeHTML}</span>
            <span>${data.date}</span>
            <span>${data.category}</span>
            <span>${data.card}</span>
            <span>${formatCurrency(data.amount)}</span>
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Excluir</button>
          </div>
        `

        item.querySelector(".edit-btn").onclick = () => startEditWithModal(item, doc, data)

        item.querySelector(".delete-btn").onclick = async () => {
          if (data.recurrenceId || data.installmentId) {
            const choice = await showRecurrenceModal()
            if (choice === "cancel") return

            let query = db.collection("transactions")
              .where("userId", "==", currentUser.uid)

            if (data.recurrenceId) query = query.where("recurrenceId", "==", data.recurrenceId)
            if (data.installmentId) query = query.where("installmentId", "==", data.installmentId)

            const snapshotInner = await query.get()

            for (const docRef of snapshotInner.docs) {
              const t = docRef.data()

              if (choice === "single") {
                if (t.date === data.date) await db.collection("transactions").doc(docRef.id).delete()
              }

              if (choice === "future") {
                if (t.date >= data.date) await db.collection("transactions").doc(docRef.id).delete()
              }

              if (choice === "all") {
                await db.collection("transactions").doc(docRef.id).delete()
              }
            }

          } else {
            if (confirm("Excluir?")) {
              await db.collection("transactions").doc(doc.id).delete()
            }
          }
        }

        list.appendChild(item)
      })

      // 🔹 Calcula totals UMA vez
      const transactions = snapshot.docs.map(doc => doc.data())
      const totals = calculateTotals(transactions)

      // --- ATUALIZA DASHBOARD ---
      const periodSelect = document.getElementById("dashboard-period")

      if (periodSelect && periodSelect.value === "monthly") {
        updateDashboardCardsAndInsights(totals)
      }


      // --- ATUALIZA RESUMO MENSAL ---
      document.getElementById("monthly-entradas").textContent =
        "Entradas: " + formatCurrency(totals.totalEntradas)

      document.getElementById("monthly-saidas").textContent =
        "Saídas: " + formatCurrency(totals.totalSaidas)

      document.getElementById("monthly-saldo").textContent =
        "Saldo: " + formatCurrency(totals.saldo)


      updateCharts(transactions)
    }

      
    )}




// =========================
// ANUAL
// =========================

async function calculateAnnualSummary() {
  if (!currentUser) return

  const snapshot = await db.collection("transactions")
    .where("userId", "==", currentUser.uid)
    .where("year", "==", selectedYear)
    .get()

  const transactions = snapshot.docs.map(doc => doc.data())

  if (transactions.length === 0) {
    document.getElementById("annual-total").textContent = "Total do ano: R$ 0,00"
    document.getElementById("annual-average").textContent = "Saldo anual: R$ 0,00"
    document.getElementById("annual-best").textContent = "Mês com maior saldo: -"
    document.getElementById("annual-worst").textContent = "Mês com menor saldo: -"
    
    return
  }

  // --- CALCULA TOTAIS ---
  let totalEntradas = 0
  let totalSaidas = 0
  let monthlyBalances = {} // saldo por mês
  let categoryTotals = {}
  let cardTotals = {}
  let userTotals = {}

  transactions.forEach(data => {
    if (data.type === "entrada") {
      totalEntradas += data.amount
    } else {
      totalSaidas += data.amount
      categoryTotals[data.category] = (categoryTotals[data.category] || 0) + data.amount
      cardTotals[data.card] = (cardTotals[data.card] || 0) + data.amount
      userTotals[data.userName] = (userTotals[data.userName] || 0) + data.amount
    }

    // Saldo mensal
    monthlyBalances[data.month] = (monthlyBalances[data.month] || 0) + (data.type === "entrada" ? data.amount : -data.amount)
  })

  const saldoAnual = totalEntradas - totalSaidas
  const averageMonthly = saldoAnual / 12

  // --- MELHOR / PIOR MÊS ---
  let bestMonth = "-", worstMonth = "-"
  let bestValue = -Infinity, worstValue = Infinity

  for (let m = 1; m <= 12; m++) {
    const val = monthlyBalances[m] || 0
    if (val > bestValue) {
      bestValue = val
      bestMonth = m
    }
    if (val < worstValue) {
      worstValue = val
      worstMonth = m
    }
  }

  const monthNames = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ]

  document.getElementById("annual-total").textContent = "Total do ano: " + formatCurrency(saldoAnual)
  document.getElementById("annual-average").textContent = "Saldo médio mensal: " + formatCurrency(averageMonthly)
  document.getElementById("annual-best").textContent = "Mês com maior saldo: " + monthNames[bestMonth - 1]
  document.getElementById("annual-worst").textContent = "Mês com menor saldo: " + monthNames[worstMonth - 1]

  const totals = { totalEntradas, totalSaidas, saldo: saldoAnual, categoryTotals, cardTotals, userTotals }
  updateCharts(transactions)
}

async function updateAnnualDashboard() {
  if (!currentUser) return

  const snapshot = await db.collection("transactions")
    .where("userId", "==", currentUser.uid)
    .where("year", "==", selectedYear)
    .get()


  const transactions = snapshot.docs.map(doc => doc.data())

  const totals = calculateTotals(transactions)
  updateDashboardCardsAndInsights(totals)
}

// =========================
// EDIÇÃO COM MODAL PARA PARCELADO
// =========================

async function startEditWithModal(item, doc, data) {
  if (!item || !doc) return
  if (isEditing) {
    alert("Finalize a edição atual primeiro.")
    return
  }

  isEditing = true

  const categoryOptions = categories.map(cat =>
    `<option value="${cat}" ${data.category === cat ? "selected" : ""}>${cat}</option>`
  ).join("")

  const cardOptions = cards.map(card =>
    `<option value="${card}" ${data.card === card ? "selected" : ""}>${card}</option>`
  ).join("")

  item.innerHTML = `
    <div class="transaction-row">
      <input type="text" id="edit-desc-${doc.id}" value="${data.description}" />
      <input type="date" id="edit-date-${doc.id}" value="${data.date}" />
      <select id="edit-category-${doc.id}">${categoryOptions}</select>
      <select id="edit-card-${doc.id}">${cardOptions}</select>
      <input type="number" step="0.01" id="edit-amount-${doc.id}" value="${data.amount}" />
      <button class="save-btn">Salvar</button>
      <button class="cancel-btn">Cancelar</button>
    </div>
  `

  item.querySelector(".save-btn").onclick = async () => {

    const newDate = document.getElementById(`edit-date-${doc.id}`).value
    const [year, month, day] = newDate.split("-").map(Number)

    const updatedData = {
      description: document.getElementById(`edit-desc-${doc.id}`).value,
      category: document.getElementById(`edit-category-${doc.id}`).value,
      card: document.getElementById(`edit-card-${doc.id}`).value,
      amount: Number(document.getElementById(`edit-amount-${doc.id}`).value),
      date: newDate,
      month,
      year
    }

    if ((data.mode === "recorrente" && data.recurrenceId) || (data.mode === "parcelado" && data.installmentId)) {

      const choice = await showRecurrenceModal()
      if (choice === "cancel") return

      const newDay = Number(day)

      let query = db.collection("transactions").where("userId", "==", currentUser.uid)

      if (data.mode === "recorrente") query = query.where("recurrenceId", "==", data.recurrenceId)
      if (data.mode === "parcelado") query = query.where("installmentId", "==", data.installmentId)

      const snapshot = await query.get()

      for (const docRef of snapshot.docs) {
        const oldData = docRef.data()
        const safeDate = createSafeDate(oldData.year, oldData.month, newDay)

        if (choice === "single" && oldData.date !== data.date) continue
        if (choice === "future" && oldData.date < data.date) continue

        await db.collection("transactions").doc(docRef.id).update({
          description: updatedData.description,
          category: updatedData.category,
          card: updatedData.card,
          amount: updatedData.amount,
          date: safeDate
        })
      }

    } else {
      await db.collection("transactions").doc(doc.id).update(updatedData)
    }

    isEditing = false
    startListener()
  }

  item.querySelector(".cancel-btn").onclick = () => {
    isEditing = false
    startListener()
  }
}

// =========================
// INSIGHTS
// =========================

function updateInsights(categoryTotals, cardTotals, userTotals) {

  function getTop(obj) {
    let maxKey = "-"
    let maxValue = 0
    for (let key in obj) {
      if (obj[key] > maxValue) {
        maxValue = obj[key]
        maxKey = key
      }
    }
    return maxKey
  }

  document.getElementById("top-category").textContent =
    "Categoria com maior gasto: " + getTop(categoryTotals)

  document.getElementById("top-card").textContent =
    "Forma mais usada: " + getTop(cardTotals)

  document.getElementById("top-user").textContent =
    "Quem mais gastou: " + getTop(userTotals)
}

// =========================
// RECORRÊNCIA ANUAL
// =========================

async function ensureRecurringForYear(targetYear) {

  if (!currentUser) return

  const snapshot = await db.collection("transactions")
    .where("userId", "==", currentUser.uid)
    .where("mode", "==", "recorrente")
    .where("year", "<", targetYear) // 👈 pega só recorrentes base
    .get()

  for (const doc of snapshot.docs) {

    const data = doc.data()

    // 👇 Garante que só use o mês original como base
    if (data.year === targetYear) continue

    const recurringDay = data.recurringDay || 1
    const baseMonth = data.month

    for (let m = baseMonth; m <= 12; m++) {

      const exists = await db.collection("transactions")
        .where("userId", "==", currentUser.uid)
        .where("recurrenceId", "==", data.recurrenceId)
        .where("month", "==", m)
        .where("year", "==", targetYear)
        .get()

      if (exists.empty) {

        const safeDate = createSafeDate(targetYear, m, recurringDay)

        await db.collection("transactions").add({
          ...data,
          date: safeDate,
          month: m,
          year: targetYear,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })

      }
    }
  }
}

// =========================
// INICIALIZAÇÃO
// =========================

auth.onAuthStateChanged(user => {
  if (user) renderApp(user)
  else renderLogin()
})