
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO DA API ---
    // ESTA É A ÚNICA PARTE QUE VOCÊ PRECISA EDITAR.
    // O CÓDIGO SÓ FUNCIONARÁ DEPOIS QUE VOCÊ SUBSTITUIR OS VALORES ABAIXO.

    const AIRTABLE_TOKEN = 'patHjD6LlFTTaxdsD.ba226573239cf2ca19292130775c52c82865d6f796681361fee8731c79bf8a0c'; // Token configurado
    const AIRTABLE_BASE_ID = 'appI79NRVIMr4PKHA';    // Base ID configurado
    const AIRTABLE_TABLE_NAME = 'Table 1';               // Nome da tabela

    // ========================================================================
    // NÃO ALTERE NADA ABAIXO DESTA LINHA
    // ========================================================================

    const API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    // --- SELETORES DO DOM ---
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const clientForm = document.getElementById('client-form');
    const clientList = document.getElementById('client-list');
    const clientListContent = document.getElementById('client-list-content');
    const addClientBtn = document.getElementById('add-client-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalOverlay = document.querySelector('.modal-overlay');

    let currentEditingId = null;

    // Verificar se todos os elementos existem antes de continuar
    if (!loader || !emptyState || !modalContainer || !modalTitle || !clientForm || 
        !clientList || !clientListContent || !addClientBtn || !closeModalBtn || 
        !cancelBtn || !modalOverlay) {
        console.error('Alguns elementos do DOM não foram encontrados');
        return;
    }

    // --- FUNÇÕES DA API (CRUD) ---
    const saveClient = async (clientData) => {
        const url = currentEditingId ? `${API_URL}/${currentEditingId}` : API_URL;
        const method = currentEditingId ? 'PATCH' : 'POST';

        const body = {
            fields: {
                nome: clientData.nome,
                email: clientData.email,
                telefone: clientData.telefone,
            }
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("ERRO DETALHADO DA API AIRTABLE:", errorData);
                const errorMessage = `Erro do Airtable: ${errorData.error?.message || `Status ${response.status}`}`;
                throw new Error(errorMessage);
            }

            showToast(`Cliente ${currentEditingId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            closeModal();
            fetchClients();

        } catch (error) {
            console.error("FALHA AO SALVAR:", error);
            showToast(error.message, 'error');
        }
    };

    const fetchClients = async () => {
        showLoader(true);
        try {
            const response = await fetch(`${API_URL}?sort%5B0%5D%5Bfield%5D=nome&sort%5B0%5D%5Bdirection%5D=asc`, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const data = await response.json();
            renderClients(data.records);
        } catch (error) {
            showToast(`Erro ao buscar clientes: ${error.message}`, 'error');
            showEmptyState(true);
        } finally {
            showLoader(false);
        }
    };

    const deleteClient = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });
            if (!response.ok) throw new Error('Falha ao excluir o cliente.');
            showToast('Cliente excluído com sucesso!', 'success');
            fetchClients();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const renderClients = (clients) => {
        clientListContent.classList.add('hidden');
        if (clients.length === 0) {
            showEmptyState(true);
            return;
        }
        showEmptyState(false);
        clientList.innerHTML = clients.map(client => createClientListItem(client)).join('');
        const items = document.querySelectorAll('.list-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 60}ms`;
        });
        clientListContent.classList.remove('hidden');
        
        // Substituir ícones do Feather se disponível
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    };

    const createClientListItem = ({ id, fields }) => {
        const { nome, email, telefone } = fields;
        return `
            <div class="list-item" data-id="${id}">
                <div class="item-name">${nome || 'Nome não informado'}</div>
                <div class="item-contact">${email || 'E-mail não informado'}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Editar"><i data-feather="edit-2" style="width:18px; height:18px;"></i></button>
                    <button class="action-btn delete-btn" title="Excluir"><i data-feather="trash-2" style="width:18px; height:18px;"></i></button>
                </div>
            </div>
        `;
    };

    const showLoader = (show) => {
        loader.classList.toggle('hidden', !show);
        if (show) {
            clientListContent.classList.add('hidden');
            emptyState.classList.add('hidden');
        }
    };

    const showEmptyState = (show) => {
        emptyState.classList.toggle('hidden', !show);
    };

    const openModal = (client = null) => {
        clientForm.reset();
        if (client) {
            currentEditingId = client.id;
            modalTitle.textContent = 'Editar Cliente';
            document.getElementById('nome').value = client.fields.nome || '';
            document.getElementById('email').value = client.fields.email || '';
            document.getElementById('telefone').value = client.fields.telefone || '';
        } else {
            currentEditingId = null;
            modalTitle.textContent = 'Adicionar Novo Cliente';
        }
        modalContainer.classList.remove('hidden');
    };

    const closeModal = () => {
        modalContainer.classList.add('hidden');
    };

    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i data-feather="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> ${message}`;
        toastContainer.appendChild(toast);
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    };

    // --- EVENT LISTENERS ---
    addClientBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
        };
        saveClient(clientData);
    });

    clientList.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            const listItem = editBtn.closest('.list-item');
            const clientId = listItem.dataset.id;
            try {
                const response = await fetch(`${API_URL}/${clientId}`, { 
                    headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } 
                });
                if (!response.ok) throw new Error('Não foi possível carregar os dados do cliente.');
                const client = await response.json();
                openModal(client);
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
        
        if (deleteBtn) {
            const listItem = deleteBtn.closest('.list-item');
            deleteClient(listItem.dataset.id);
        }
    });

    // Inicializar aplicação
    fetchClients();
    
    // Inicializar ícones do Feather se disponível
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});
