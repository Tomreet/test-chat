const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const getAuthHeader = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? { 
    'X-User-ID': currentUser.id.toString(),
    'Authorization': `Bearer ${currentUser.token || ''}`
  } : {};
};

export const loadUsers = async () => {
  try {
    const headers = getAuthHeader();
    console.log('Request headers:', headers);

    const response = await fetch(`${API_BASE_URL}/users.json`, {
      headers: headers
    });

    if (response.status === 401) {
      localStorage.removeItem('currentUser');
      window.location.reload();
      return [];
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Received invalid users data format');
    }
    return data;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

export const saveUsers = async (users) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users.json`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(users),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сохранения: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Ошибка сохранения пользователей:', error);
    return false;
  }
};

export const loadChannels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/channels.json`, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки каналов:', error);
    return [];
  }
};

export const saveChannels = async (channels) => {
  try {
    const response = await fetch(`${API_BASE_URL}/channels.json`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(channels),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сохранения: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Ошибка сохранения каналов:', error);
    return false;
  }
};
