const API_BASE = 'http://localhost:8000/api';

function getAuthHeaders() {
	const token = localStorage.getItem('access_token');
	return {
		'Content-Type': 'application/json',
		...(token ? { 'Authorization': `Bearer ${token}` } : {})
	};
}

export const usuariosAPI = {
	obtener: async (id: number) => {
		const response = await fetch(`${API_BASE}/usuarios/${id}`, { 
			headers: getAuthHeaders() 
		});
		if (!response.ok) {
			throw new Error('Usuario no encontrado o sesión inválida');
		}
		return response.json();
	},
	desactivar: (id: number) =>
	fetch(`${API_BASE}/usuarios/${id}/desactivar`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	}).then(res => res.json())
};

export const actividadesAPI = {
	obtener: async (usuarioId: number, dias: number = 7) => {
		const response = await fetch(`${API_BASE}/usuarios/${usuarioId}/actividades?dias=${dias}`, { 
			headers: getAuthHeaders() 
		});
		if (!response.ok) {
			throw new Error('Error al cargar actividades');
		}
		return response.json();
	},
	registrar: (usuarioId: number, data: any) =>
	fetch(`${API_BASE}/usuarios/${usuarioId}/actividades`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	}).then(res => res.json())
};

export const estadisticasAPI = {
	obtener: async (usuarioId: number) => {
		const response = await fetch(`${API_BASE}/usuarios/${usuarioId}/estadisticas`, { 
			headers: getAuthHeaders() 
		});
		if (!response.ok) {
			throw new Error('Error al cargar estadísticas');
		}
		return response.json();
	}
};

export const hitosAPI = {
	obtener: async (usuarioId: number) => {
		const response = await fetch(`${API_BASE}/usuarios/${usuarioId}/hitos`, { 
			headers: getAuthHeaders() 
		});
		if (!response.ok) {
			throw new Error('Error al cargar hitos');
		}
		return response.json();
	},
	registrar: (usuarioId: number, tipo: string, valor_xp: number, descripcion?: string) =>
	fetch(`${API_BASE}/usuarios/${usuarioId}/hitos`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ tipo, valor_xp, descripcion })
	}).then(res => res.json())
};

export const authAPI = {
login: (email: string, password: string) =>
fetch(`${API_BASE}/auth/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
body: new URLSearchParams({ username: email, password }).toString()
}).then(res => res.json())
};
