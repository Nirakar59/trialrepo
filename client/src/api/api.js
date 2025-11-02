import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000/api",
  // baseURL: "https://sanjal-chakra.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});


API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// api for login
export const login = async (email, password) => {
  try {
    const response = await API.post("auth/login", { email, password });
    return response.data; // JSON response from backend
  } catch (error) {
   const errorMessage = error.response?.data || error.message;
    console.error("Login failed:", errorMessage);
    throw errorMessage;
  }
};

//api for signup
export const signup = async (fullname, email, password) => {
    try {
        const response = await API.post("auth/ register", { fullname, email, password })
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
    console.error("Signup failed:", errorMessage);
    throw errorMessage;
    }
}









//To create the post

export const createPost = async (formData) => {
  try {
    console.log("yasama aayo");
    const response = await API.post("/post/createpost", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

// To create story
export const createStory = async (text, image) => {
  try {
    console.log(text, image);
    const response = await API.post("/story/", { caption : text,storyImage : image }, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }).then((response) => {
      console.log(response.data);
      return response.data;
    });
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
};

///--------------------------API for feeed of the------------------

//get story on the home page

export const getAllStory = async () => {
  try {
    const response = await API.get("/story/", {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error("Failed to fetch story:", errorMessage);
    throw errorMessage;
  }
};

//API for get all post

export const getAllPost = async () => {
  try {
    const response = await API.get("/post/getAllPost", {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error("Failed to fetch posts:", errorMessage);
    throw errorMessage;
  }
};

//API for get my posr

export const getMyPosts = async () => {
  try {
    const response = await API.get("/post/getmyposts", {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error("Failed to fetch posts:", errorMessage);
    throw errorMessage;
  }
};

//API to message

export const chat = async (text, image) => {
  try {
    const response = await API.post("/message/sendMessage", { text, image });
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error("Failed to message:", errorMessage);
    throw errorMessage;
  }
};

export default API;
