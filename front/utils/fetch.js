import axios from 'axios';

class FetchService {
  // Método GET
  async get(url) {
    try {
        console.log(process.env.API_URL+url);
        
      const response = await axios.get(process.env.API_URL+url);
      return response.data; // Axios devuelve los datos en la propiedad 'data'
    } catch (error) {
    //   console.error('Error en GET:', error);
      return null
    }
  }

  // Método POST
  async post(url, data) {
    try {
      const response = await axios.post(process.env.API_URL+url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
    //   console.error('Error en POST:', error);
      return null
    }
  }

  // Método PUT
  async put(url, data) {
    try {
      const response = await axios.put(process.env.API_URL+url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
    //   console.error('Error en PUT:', error);
      return null
    }
  }

  // Método DELETE
  async delete(url) {
    try {
      const response = await axios.delete(process.env.API_URL+url);
      return response.status === 200; // Devuelve true si se eliminó correctamente
    } catch (error) {
    //   console.error('Error en DELETE:', error);
      return null
    }
  }
}

export default new FetchService();
