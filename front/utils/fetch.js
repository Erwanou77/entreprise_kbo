import axios from 'axios';

class FetchService {
  // Método GET
  async get(url) {
    try {
        console.log(process.env.API_URI +url);
        
      const response = await axios.get(process.env.API_URI +url);
      return response.data; // Axios devuelve los datos en la propiedad 'data'
    } catch (error) {
    //   console.error('Error en GET:', error);
      return null
    }
  }

  // Método POST
  async post(url, data) {
    try {
      console.log(process.env.API_URI +url);
      console.log(data);
      
      const response = await axios.post(process.env.API_URI +url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response);
      
      return response.data;
    } catch (error) {
      console.error('Error en POST:', error);
      return null
    }
  }

  // Método PUT
  async put(url, data,Bearer=null) {
    try {
      let head={}
      console.log(process.env.API_URI +url, data,Bearer);
      head['Content-Type']='application/json'
      if (Bearer){
      head['Authorization']=`Bearer ${Bearer}`}
      
      const response = await axios.put(process.env.API_URI +url, data, {
        headers: head,
      });
      return response.data;
    } catch (error) {
      console.error('Error en PUT:', error);
      return null
    }
  }

  // Método DELETE
  async delete(url) {
    try {
      const response = await axios.delete(process.env.API_URI +url);
      return response.status === 200; // Devuelve true si se eliminó correctamente
    } catch (error) {
    //   console.error('Error en DELETE:', error);
      return null
    }
  }
}

export default new FetchService();
