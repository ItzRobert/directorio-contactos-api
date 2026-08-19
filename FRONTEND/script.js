(function () {
  "use strict";

  /* ============================================================
     CONFIGURACIÓN
     ============================================================ */

  const API_URL = "http://localhost:3000/api";

  let contacts = [];
  let searchTerm = "";
  let showOnlyFavs = false;
  let pendingDeleteId = null;

  /* ============================================================
     REFERENCIAS DOM
     ============================================================ */

  const contentEl = document.getElementById("content");
  const indexRailEl = document.getElementById("indexRail");
  const countEl = document.getElementById("countNumber");
  const searchInput = document.getElementById("searchInput");
  const favFilterBtn = document.getElementById("favFilterBtn");
  const newBtn = document.getElementById("newContactBtn");

  const overlay = document.getElementById("overlay");
  const form = document.getElementById("contactForm");
  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");
  const cancelBtn = document.getElementById("cancelBtn");

  const inputId = document.getElementById("contactId");
  const inputName = document.getElementById("inputName");
  const inputPhone = document.getElementById("inputPhone");
  const inputEmail = document.getElementById("inputEmail");
  const inputOrg = document.getElementById("inputOrg");
  const inputNote = document.getElementById("inputNote");
  const inputFav = document.getElementById("inputFav");

  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

  /* ============================================================
     GENERAR ID
     ============================================================ */

  function cryptoId() {
    return (
      "c_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36)
    );
  }

  /* ============================================================
     GET — OBTENER TODOS LOS CONTACTOS
     ============================================================ */

  async function loadContacts() {
    try {
      const response = await fetch(`${API_URL}/get`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "No se pudieron cargar los contactos."
        );
      }

      contacts = Array.isArray(data) ? data : [];

      render();

    } catch (error) {
      console.error("Error al cargar contactos:", error);

      contacts = [];

      render();

      showToast("No se pudieron cargar los contactos.");
    }
  }

  /* ============================================================
     POST — CREAR CONTACTO
     ============================================================ */

  async function createContact(contact) {
    try {
      const response = await fetch(`${API_URL}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(contact)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "No se pudo crear el contacto."
        );
      }

      contacts.push(data);

      render();

      showToast("Contacto agregado");

      return true;

    } catch (error) {
      console.error("Error al crear contacto:", error);

      showToast(
        error.message || "No se pudo crear el contacto."
      );

      return false;
    }
  }

  /* ============================================================
     PUT — ACTUALIZAR CONTACTO
     ============================================================ */

  async function updateContact(contact) {
    try {
      const response = await fetch(
        `${API_URL}/put/${encodeURIComponent(contact._id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(contact)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "No se pudo actualizar el contacto."
        );
      }

      const index = contacts.findIndex(
        (c) => c._id === contact._id
      );

      if (index !== -1) {
        contacts[index] = data;
      }

      render();

      showToast("Contacto actualizado");

      return true;

    } catch (error) {
      console.error("Error al actualizar contacto:", error);

      showToast(
        error.message || "No se pudo actualizar el contacto."
      );

      return false;
    }
  }

  /* ============================================================
     DELETE — ELIMINAR CONTACTO
     ============================================================ */

  async function deleteContact(id) {
    try {
      const response = await fetch(
        `${API_URL}/delete/${encodeURIComponent(id)}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "No se pudo eliminar el contacto."
        );
      }

      contacts = contacts.filter(
        (contact) => contact._id !== id
      );

      render();

      showToast("Contacto eliminado");

      return true;

    } catch (error) {
      console.error("Error al eliminar contacto:", error);

      showToast(
        error.message || "No se pudo eliminar el contacto."
      );

      return false;
    }
  }

  /* ============================================================
     UTILIDADES
     ============================================================ */

  function normalize(str) {
    return (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function firstLetter(name) {
    const ch = normalize(name)
      .trim()
      .charAt(0)
      .toUpperCase();

    return /[A-Z]/.test(ch) ? ch : "#";
  }

  function isValidEmail(value) {
    if (!value) return true;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showToast(message) {
    clearTimeout(toastTimer);

    toastEl.textContent = message;

    toastEl.classList.add("show");

    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2400);
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  /* ============================================================
     FILTRADO
     ============================================================ */

  function getFilteredContacts() {
    let list = contacts.slice();

    if (showOnlyFavs) {
      list = list.filter((c) => c.favorito);
    }

    if (searchTerm.trim()) {
      const q = normalize(searchTerm);

      list = list.filter((c) =>
        normalize(c.nombre).includes(q) ||
        normalize(c.empresa).includes(q) ||
        normalize(c.telefono).includes(q) ||
        normalize(c.correo).includes(q) ||
        normalize(c.notas).includes(q)
      );
    }

    list.sort((a, b) =>
      normalize(a.nombre).localeCompare(
        normalize(b.nombre),
        "es"
      )
    );

    return list;
  }

  /* ============================================================
     ÍNDICE ALFABÉTICO
     ============================================================ */

  function renderIndexRail(groupedLetters) {
    indexRailEl.innerHTML = "";

    ALPHABET.forEach((letter) => {
      const btn = document.createElement("button");

      btn.type = "button";
      btn.textContent = letter;

      const active = groupedLetters.has(letter);

      if (active) {
        btn.classList.add("has-contacts");
      }

      btn.disabled = !active;

      btn.setAttribute(
        "aria-label",
        active
          ? `Ir a contactos con ${letter}`
          : `Sin contactos con ${letter}`
      );

      btn.addEventListener("click", () => {
        const target = document.getElementById(
          "letter-" + letter
        );

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });

      indexRailEl.appendChild(btn);
    });
  }

  /* ============================================================
     RENDER PRINCIPAL
     ============================================================ */

  function render() {
    const filtered = getFilteredContacts();

    countEl.textContent = contacts.length;

    const groups = new Map();

    filtered.forEach((contact) => {
      const letter = firstLetter(contact.nombre);

      if (!groups.has(letter)) {
        groups.set(letter, []);
      }

      groups.get(letter).push(contact);
    });

    renderIndexRail(groups);

    contentEl.innerHTML = "";

    if (contacts.length === 0) {
      contentEl.appendChild(
        buildEmptyState(
          "Tu directorio está vacío",
          "Agrega tu primer contacto para empezar a construir tu fichero.",
          true
        )
      );

      return;
    }

    if (filtered.length === 0) {
      contentEl.appendChild(
        buildEmptyState(
          "No encontramos coincidencias",
          showOnlyFavs
            ? "No tienes favoritos que coincidan con tu búsqueda."
            : "Prueba con otro nombre, empresa, teléfono o correo.",
          false
        )
      );

      return;
    }

    ALPHABET.forEach((letter) => {
      if (!groups.has(letter)) return;

      const groupEl = document.createElement("section");

      groupEl.className = "letter-group";
      groupEl.id = "letter-" + letter;

      const heading = document.createElement("div");

      heading.className = "letter-heading";

      heading.innerHTML = `
        <span class="badge">${letter}</span>
        <span class="rule"></span>
      `;

      groupEl.appendChild(heading);

      const grid = document.createElement("div");

      grid.className = "card-grid";

      groups.get(letter).forEach((contact) => {
        grid.appendChild(buildCard(contact));
      });

      groupEl.appendChild(grid);

      contentEl.appendChild(groupEl);
    });
  }

  /* ============================================================
     ESTADO VACÍO
     ============================================================ */

  function buildEmptyState(title, msg, showCta) {
    const wrap = document.createElement("div");

    wrap.className = "empty-state";

    wrap.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
      >
        <rect x="3" y="7" width="18" height="13" rx="1.5"/>
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <path d="M9 13h6M9 16h4"/>
      </svg>

      <h3>${escapeHtml(title)}</h3>

      <p>${escapeHtml(msg)}</p>

      ${
        showCta
          ? '<button class="btn btn-primary" id="emptyCta">Agregar primer contacto</button>'
          : ""
      }
    `;

    if (showCta) {
      wrap
        .querySelector("#emptyCta")
        .addEventListener("click", () => openModal());
    }

    return wrap;
  }

  /* ============================================================
     CREAR TARJETA
     ============================================================ */

  function buildCard(c) {
    const card = document.createElement("article");

    card.className = "card";

    const isConfirming =
      pendingDeleteId === c._id;

    card.innerHTML = `
      <div class="card-top">

        <div>
          <div class="card-name">
            ${escapeHtml(c.nombre)}
          </div>

          ${
            c.empresa
              ? `<div class="card-org">
                   ${escapeHtml(c.empresa)}
                 </div>`
              : ""
          }
        </div>

        <button
          class="fav-btn ${c.favorito ? "is-fav" : ""}"
          type="button"
          aria-label="${
            c.favorito
              ? "Quitar de favoritos"
              : "Marcar como favorito"
          }"
          data-action="fav"
          data-id="${escapeHtml(c._id)}"
        >
          <svg
            viewBox="0 0 24 24"
            fill="${c.favorito ? "currentColor" : "none"}"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 17.3 6.2 20.5l1.1-6.5L2.5 9.3l6.5-.9L12 2.5l3 5.9 6.5.9-4.8 4.7 1.1 6.5z"/>
          </svg>
        </button>

      </div>

      <div class="card-detail">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2z"/>
        </svg>

        <a href="tel:${encodeURIComponent(c.telefono || "")}">
          ${escapeHtml(c.telefono)}
        </a>

      </div>

      ${
        c.correo
          ? `
            <div class="card-detail">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 10 6 10-6"/>
              </svg>

              <a href="mailto:${encodeURIComponent(c.correo)}">
                ${escapeHtml(c.correo)}
              </a>

            </div>
          `
          : ""
      }

      ${
        c.notas
          ? `
            <div class="card-note">
              ${escapeHtml(c.notas)}
            </div>
          `
          : ""
      }

      <div class="card-actions">

        <button
          class="icon-btn"
          type="button"
          data-action="edit"
          data-id="${escapeHtml(c._id)}"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>

          Editar
        </button>

        <button
          class="icon-btn danger ${isConfirming ? "confirm" : ""}"
          type="button"
          data-action="delete"
          data-id="${escapeHtml(c._id)}"
        >

          ${
            isConfirming
              ? "Confirmar eliminar"
              : `
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 6h18"/>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                </svg>

                Eliminar
              `
          }

        </button>

      </div>
    `;

    return card;
  }

  /* ============================================================
     EVENTOS DE LAS TARJETAS
     ============================================================ */

  contentEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(
      "button[data-action]"
    );

    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    /* FAVORITO */

    if (action === "fav") {
      const contact = contacts.find(
        (x) => x._id === id
      );

      if (!contact) return;

      const updatedContact = {
        ...contact,
        favorito: !contact.favorito
      };

      await updateContact(updatedContact);

      return;
    }

    /* EDITAR */

    if (action === "edit") {
      const contact = contacts.find(
        (x) => x._id === id
      );

      if (contact) {
        openModal(contact);
      }

      return;
    }

    /* ELIMINAR */

    if (action === "delete") {

      if (pendingDeleteId === id) {

        const deleted = await deleteContact(id);

        if (deleted) {
          pendingDeleteId = null;
        }

      } else {

        pendingDeleteId = id;

        render();

        setTimeout(() => {

          if (pendingDeleteId === id) {
            pendingDeleteId = null;
            render();
          }

        }, 3000);
      }
    }
  });

  /* ============================================================
     MODAL
     ============================================================ */

  function openModal(contact) {

    form.reset();

    clearErrors();

    if (contact) {

      modalTitle.textContent =
        "Editar contacto";

      modalSub.textContent =
        "Actualiza los datos de " +
        contact.nombre +
        ".";

      inputId.value =
        contact.id || "";

      inputName.value =
        contact.nombre || "";

      inputPhone.value =
        contact.telefono || "";

      inputEmail.value =
        contact.correo || "";

      inputOrg.value =
        contact.empresa || "";

      inputNote.value =
        contact.notas || "";

      inputFav.checked =
        !!contact.favorito;

      /*
       * Guardamos el _id de MongoDB
       * en el formulario.
       */
      form.dataset.mongoId =
        contact._id || "";

    } else {

      modalTitle.textContent =
        "Nuevo contacto";

      modalSub.textContent =
        "Completa los datos de la persona que quieres guardar.";

      inputId.value = "";

      form.dataset.mongoId = "";
    }

    overlay.classList.add("open");

    setTimeout(() => {
      inputName.focus();
    }, 30);
  }

  function closeModal() {
    overlay.classList.remove("open");
  }

  function clearErrors() {

    [
      "fieldName",
      "fieldPhone",
      "fieldEmail"
    ].forEach((id) => {

      const element =
        document.getElementById(id);

      if (element) {
        element.classList.remove(
          "has-error"
        );
      }

    });
  }

  /* ============================================================
     EVENTOS DEL MODAL
     ============================================================ */

  newBtn.addEventListener(
    "click",
    () => openModal()
  );

  cancelBtn.addEventListener(
    "click",
    closeModal
  );

  overlay.addEventListener(
    "click",
    (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (e) => {

      if (
        e.key === "Escape" &&
        overlay.classList.contains("open")
      ) {
        closeModal();
      }

    }
  );

  /* ============================================================
     CREAR / EDITAR CONTACTO
     ============================================================ */

  form.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      clearErrors();

      const nombre =
        inputName.value.trim();

      const telefono =
        inputPhone.value.trim();

      const correo =
        inputEmail.value.trim();

      let valid = true;

      /* VALIDAR NOMBRE */

      if (!nombre) {

        document
          .getElementById("fieldName")
          .classList.add("has-error");

        valid = false;
      }

      /* VALIDAR TELÉFONO */

      if (!telefono) {

        document
          .getElementById("fieldPhone")
          .classList.add("has-error");

        valid = false;
      }

      /* VALIDAR CORREO */

      if (!isValidEmail(correo)) {

        document
          .getElementById("fieldEmail")
          .classList.add("has-error");

        valid = false;
      }

      if (!valid) return;

      /* ========================================================
         CREAR OBJETO
         ======================================================== */

      const contacto = {

        id:
          inputId.value.trim() ||
          cryptoId(),

        nombre: nombre,

        telefono: telefono,

        correo: correo,

        empresa:
          inputOrg.value.trim(),

        notas:
          inputNote.value.trim(),

        favorito:
          inputFav.checked

      };

      /* ========================================================
         EDITAR
         ======================================================== */

      if (form.dataset.mongoId) {

        contacto._id =
          form.dataset.mongoId;

        const success =
          await updateContact(
            contacto
          );

        if (success) {
          closeModal();
        }

        return;
      }

      /* ========================================================
         CREAR
         ======================================================== */

      const success =
        await createContact(
          contacto
        );

      if (success) {
        closeModal();
      }

    }
  );

  /* ============================================================
     BÚSQUEDA
     ============================================================ */

  searchInput.addEventListener(
    "input",
    (e) => {

      searchTerm =
        e.target.value;

      pendingDeleteId = null;

      render();
    }
  );

  /* ============================================================
     FILTRO FAVORITOS
     ============================================================ */

  favFilterBtn.addEventListener(
    "click",
    () => {

      showOnlyFavs =
        !showOnlyFavs;

      favFilterBtn.classList.toggle(
        "active",
        showOnlyFavs
      );

      pendingDeleteId = null;

      render();
    }
  );

  /* ============================================================
     INICIO
     ============================================================ */

  loadContacts();

})();