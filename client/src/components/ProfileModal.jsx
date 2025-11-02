import { useState,useEffect } from "react";
import { Pencil } from "lucide-react";
import API from "../api/api";
const ProfileModal = ( { setShowEdit }) => {
  const [user, setUser] = useState({});
  const [editForm, setEditForm] = useState({
    username: user.username,
    bio: user.bio,
    location: user.location,
    profilePics: null,
    cover_photo: null,
    fullName: user.fullname,
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("username", editForm.username);
      formData.append("bio", editForm.bio);
      formData.append("location", editForm.location);
      formData.append("fullName", editForm.fullName);
      if (editForm.profilePics) {
        formData.append("profilePics", editForm.profilePics);
      }
      if (editForm.cover_photo) {
        formData.append("cover_photo", editForm.cover_photo);
      }
      const res = await API.put(`/users/update/${user._id}/editprofile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      console.log(res.data);
      setShowEdit(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await API.get('/users/profile', { withCredentials: true });
        setUser(data);
        setEditForm({
          username: data.username,
          bio: data.bio,
          location: data.location,
          profilePics: null,
          cover_photo: null,
          fullName: data.fullname,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 z-110 h-screen overflow-y-scroll bg-black/50">
      <div className="max-w-2xl sm:py-6 mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Profile
          </h1>

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            {/* Profile Pic */}
            <div className="flex flex-col items-start gap-3">
              <label
                htmlFor="profile_picture"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Profile Picture
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="profile_picture"
                  className="w-full  p-3 border border-gray-200 rounded-lg"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      profilePics: e.target.files[0],
                    })
                  }
                />
                <div className="group/profile relative">
                  <img
                    src={
                      editForm.profilePics
                        ? URL.createObjectURL(editForm.profilePics)
                        : user.profilePics
                    }
                    alt=""
                    className="w-24 h-24 rounded-full object-cover mt-2"
                  />
                  <div className="absolute inset-0 hidden group-hover/profile:flex top-0 left-0 bottom-0 bg-black/20 rounded-full items-center justify-center">
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                </div>
              </label>
            </div>

                {/* CoverPhoto */}
                <div className="flex flex-col items-start gap-3">
                    <label htmlFor="cover_photo" className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Photo
                      <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="cover_photo"
                  className="w-full  p-3 border border-gray-200 rounded-lg"
                  onChange={(e) =>setEditForm({...editForm, cover_photo: e.target.files[0], })}/>
                  <div className="group/cover relative">
                    <img src={editForm.cover_photo ? URL.createObjectURL(editForm.cover_photo) : user.cover_photo } alt="" className="w-80 h-40 rounded-lg bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 object-cover mt-2" />
                       <div className="absolute hidden group-hover/cover:flex top-0 left-0 right-0 bottom-0 bg-black/20 rounded-lg items-center justify-center">
                        <Pencil className='w-5 h-5 text-white'/>
                       </div>
                  </div>
                    </label>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input type="text" className="w-full p-3 border border-gray-200 rounded-lg "
                    placeholder="Please enter your full name" onChange={(e)=>setEditForm({...editForm, fullName: e.target.value})}
                     value={editForm.fullName}/>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input type="text" className="w-full p-3 border border-gray-200 rounded-lg "
                    placeholder="Please enter a Username" onChange={(e)=>setEditForm({...editForm, username: e.target.value})}
                     value={editForm.username}/>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea rows={3} className="w-full p-3 border border-gray-200 rounded-lg "
                    placeholder="Please enter your bio" onChange={(e)=>setEditForm({...editForm, bio: e.target.value})}
                     value={editForm.bio}/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input type="text" className="w-full p-3 border border-gray-200 rounded-lg "
                    placeholder="Please enter your location" onChange={(e)=>setEditForm({...editForm, location: e.target.value})}
                     value={editForm.location}/>
                  </div>
                  <div className="flex justify-end space-x-3 pt-6">
                     <button type="button" onClick={()=>setShowEdit(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition cursor-pointer">Save Changes</button>
                  </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
