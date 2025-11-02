import { useState, useEffect } from 'react'
import { Image, X } from 'lucide-react'
import toast from 'react-hot-toast'
import  { createPost } from '../api/api.js'
import useAuth from '../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'
import API from '../api/api.js'

const CreatePost = () => {

  const [content, setContent] = useState('')
  const [image, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const {user} = useAuth();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate()
   useEffect(() => {
      const getProfile = async () => {
        try {
          const { data } = await API.get('/users/profile', { withCredentials: true });
          setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
  
      getProfile();
    }, []);
   
  const handleSubmit = async (e) => {
    e.preventDefault();
     if (!content.trim() && image.length === 0) {
      toast.error("Please add some content or images to your post");
      return;
    }
    
    setLoading(true); // Set loading state
    
    const formData = new FormData();
    formData.append("text", content);
    
    
    image.forEach((image) => {
      formData.append("image", image);
    });

    try {
      const result = await createPost(formData);
      console.log("Post created:", result);
      toast.success("Post created successfully!"); 
      
      // Reset form after successful submission
      setContent('');
      setImages([]);
      navigate('/');
    } catch (err) {
      console.error("Error uploading post:", err);
      toast.error("Failed to upload post");
    } finally {
      setLoading(false); // Reset loading state
    }
  }
  
  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Create Post</h1>
          <p className='text-slate-600'>Share your thoughts with the world</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
        <div className='max-w-xl bg-white p-4 sm:pb-3 rounded-xl shadow-md space-y-4'>
              {/* Header */}
              <div className='flex items-center gap-3'>
                <img src={profile?.profilePics || user.profile_picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"} alt=""  className='w-12 h-12 rounded-full shadow'/>
                <div>
                  <h2 className='font-semibold'>{profile?.fullname || user.fullName}</h2>
                  <p className='text-sm text-gray-500'>@{profile?.username || user.fullName}</p>
                </div>
              </div>

               {/* Textarea */}
               <textarea className='w-full resize-none max-h-20 mt-4 text-sm outline-none palceholder-gray-400'
                placeholder="What's happening?" 
                name= "text"
                onChange={(e)=>setContent(e.target.value)} value={content}/>  
                
                {/* Images */}
                {
                  image.length > 0 && <div className='flex flex-wrap gap-2 mt-4'>
                    {image.map((image, i)=> (
                      <div key={i} className='relative group'>
                        <img src={URL.createObjectURL(image)} className='h-20 rounded-md' alt="" />
                        <div onClick={()=> setImages(images.filter((_,index)=> index !==i))} className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'>
                          <X className='w-6 h-6 text-white' />
                        </div>
                      </div>
                    ))}
                  </div>
                }

                {/* Bottom Bar */}
                  <div className='flex items-center justify-between pt-3 border-t border-gray-300'>
                  <label htmlFor ="images" className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer'>
                 <Image className='size-6' />
                 </label>

                 <input type="file" id="images" accept='image/*' hidden multiple 
                 onChange={(e)=>setImages([...image, ...e.target.files])}/>

                 <button disabled={loading} type='submit' className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer'>
                  Publish Post
                 </button>

              </div>
        </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
