"use strict";

const STORAGE_KEY = "clinicadent_appointments";

document.addEventListener("DOMContentLoaded", () => {
  
  const form = document.getElementById("appointmentForm");
  const clearBtn = document.getElementById("clearBtn");
  const messageBox = document.getElementById("formMessage");
  const tbody = document.getElementById("appointmentsBody");

  
  const idInput = document.getElementById("appointmentId"); 
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const dniInput = document.getElementById("dni");
  const phoneInput = document.getElementById("phone");
  const birthDateInput = document.getElementById("birthDate");
  const notesInput = document.getElementById("notes");

  
  let appointments = loadAppointments();

  
  renderTable();

  

  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();
    setMessage("");

    const data = readForm();
    const errors = validate(data);

    if (errors.length > 0) {
      showErrors(errors);
      setMessage("Revisa los campos marcados en rojo.", true);
      return;
    }

    const editingId = idInput.value.trim();

    if (editingId) {
      
      const idx = appointments.findIndex((a) => a.id === editingId);

      if (idx === -1) {
        setMessage("No se encontró la cita para modificar (puede haberse eliminado).", true);
        idInput.value = "";
        return;
      }

      appointments[idx] = { id: editingId, ...data };
      saveAppointments(appointments);

      setMessage("Cita modificada correctamente", false);
      form.reset();
      idInput.value = "";
      renderTable();
      return;
    }

    
    const appointment = createAppointment(data);
    appointments.push(appointment);
    saveAppointments(appointments);

    setMessage("Cita guardada correctamente", false);
    form.reset();
    idInput.value = "";
    renderTable();
  });

  
  clearBtn.addEventListener("click", () => {
    form.reset();
    idInput.value = "";
    clearErrors();
    setMessage("");
  });

  
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    if (!id) return;

    
    if (btn.classList.contains("delete")) {
      appointments = appointments.filter((a) => a.id !== id);
      saveAppointments(appointments);
      renderTable();

      
      if (idInput.value.trim() === id) {
        form.reset();
        idInput.value = "";
        clearErrors();
        setMessage("La cita que estabas editando fue eliminada.", true);
      }

      return;
    }

    
    if (btn.classList.contains("edit")) {
      const found = appointments.find((a) => a.id === id);

      if (!found) {
        setMessage("No se encontró la cita para modificar.", true);
        return;
      }

      loadForm(found);
      idInput.value = found.id; 
      clearErrors();
      setMessage("Editando cita… modifica los datos y pulsa “Guardar cita”.", false);

      
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  });

  

  function readForm() {
    return {
      date: dateInput.value.trim(),
      time: timeInput.value.trim(),
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      dni: dniInput.value.trim(),
      phone: phoneInput.value.trim(),
      birthDate: birthDateInput.value.trim(),
      notes: notesInput.value.trim(),
    };
  }

  function loadForm(appointment) {
    dateInput.value = appointment.date || "";
    timeInput.value = appointment.time || "";
    firstNameInput.value = appointment.firstName || "";
    lastNameInput.value = appointment.lastName || "";
    dniInput.value = appointment.dni || "";
    phoneInput.value = appointment.phone || "";
    birthDateInput.value = appointment.birthDate || "";
    notesInput.value = appointment.notes || "";
  }

  function createAppointment(data) {
    const id = Date.now().toString(); 
    return { id, ...data };
  }

  function renderTable() {
    tbody.innerHTML = "";

    if (!appointments || appointments.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="9" class="empty">dato vacío</td>`;
      tbody.appendChild(tr);
      setCookie("hasAppointments", "0", 7);
      return;
    }

    setCookie("hasAppointments", "1", 7);

    appointments.forEach((a, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(a.date)}</td>
        <td>${escapeHtml(a.time)}</td>
        <td>${escapeHtml(a.firstName)} ${escapeHtml(a.lastName)}</td>
        <td>${escapeHtml(a.dni)}</td>
        <td>${escapeHtml(a.phone)}</td>
        <td>${escapeHtml(a.birthDate)}</td>
        <td>${escapeHtml(a.notes)}</td>
        <td>
          <button type="button" class="action-btn edit" data-id="${a.id}">Modificar</button>
          <button type="button" class="action-btn delete" data-id="${a.id}">Eliminar</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  

  function validate(data) {
    const errors = [];

    
    if (!data.date) errors.push({ field: "date", msg: "La fecha es obligatoria." });
    if (!data.time) errors.push({ field: "time", msg: "La hora es obligatoria." });
    if (!data.firstName) errors.push({ field: "firstName", msg: "El nombre es obligatorio." });
    if (!data.lastName) errors.push({ field: "lastName", msg: "Los apellidos son obligatorios." });
    if (!data.dni) errors.push({ field: "dni", msg: "El DNI es obligatorio." });
    if (!data.phone) errors.push({ field: "phone", msg: "El teléfono es obligatorio." });
    if (!data.birthDate) errors.push({ field: "birthDate", msg: "La fecha de nacimiento es obligatoria." });

    
    if (data.phone && !/^\d{9,15}$/.test(data.phone)) {
      errors.push({ field: "phone", msg: "El teléfono debe ser numérico (9 a 15 dígitos)." });
    }

    
    if (data.dni && !/^\d{7,8}[A-Za-z]$/.test(data.dni)) {
      errors.push({ field: "dni", msg: "Formato DNI inválido. Ej: 12345678Z" });
    }

    return errors;
  }

  function showErrors(errors) {
    errors.forEach((e) => {
      const input = document.getElementById(e.field);
      const errorEl = document.querySelector(`[data-error-for="${e.field}"]`);

      if (input) input.style.borderColor = "#b91c1c";
      if (errorEl) errorEl.textContent = e.msg;
    });
  }

  function clearErrors() {
    const inputs = form.querySelectorAll("input, textarea");
    inputs.forEach((el) => (el.style.borderColor = "#d1d5db"));

    const errorEls = form.querySelectorAll(".error");
    errorEls.forEach((el) => (el.textContent = ""));
  }

  function setMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.style.color = isError ? "#b91c1c" : "#0f766e";
  }

  

  function loadAppointments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveAppointments(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  

  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
  }

  

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
});
