import axios from 'axios';


const BASE_URL = "http://localhost:8081/api";

const client = axios.create({
    baseURL: BASE_URL,
    json: true
});

export default {
    async execute(method, resource, data) {
        console.log("ici api js")
        return client({
            method,
            url: resource,
            data,
            headers: {
                // rien
            }
        }).then(req => {
            return req.data;
        }).catch(error => {
            return error.response.data;
        });
    },
    getSkills(){
        console.log('about to run getSkills')
        return this.execute('get', '/skills')
    }
}