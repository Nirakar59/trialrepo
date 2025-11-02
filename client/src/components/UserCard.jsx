import { MapPin, MessageCircle, Plus, UserPlus } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import API from '../api/api'
const UserCard = ({user}) => {
  console.log(user)
  const {user: currentUser} = useAuth()
  // console.log(currentUser.following)
  const handleFollow = async (userId) => {
    const res = await API.put(`/users/${userId}/follow`, {}, {withCredentials: true})
    console.log(res.data)
  }
  const handleConnectionRequest = async (userId) => {
    const res = await API.post(`/users/${userId}/sendrequest`, {}, {withCredentials: true})
    console.log(res.data)
  }

  return (
    <div key={user._id} className='p-4 pt-6 flex flex-col justify-between w-72 shadow border border-gray-200 rounded-md'>
      <div className='text-center'>
        <img src={user.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"} alt="" className='rounded-full w-16 shadow-md mx-auto' />
        <p className='mt-4 font-semibold'>{user.fullname}</p>
        {user.username && <p className='text-gray-500 font-light'>@{user.username}</p>}
        {user.bio && <p className='text-gray-600 mt-2 text-center text-sm px-4'>{user.bio}</p>}
     </div>

       <div className='flex items-center justify-center gap-2 mt-4 text-xs text-gray-600'>
        <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
          <MapPin className='w-4 h-4'/> {user.location || 'No Location'}
        </div>
        <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
          <span>{user.followers.length}</span> Followers
        </div>
       </div>
        
        <div className='flex mt-4 gap-2'>
          {/* Follow Button */}
          <button onClick={()=> handleFollow(user._id)} disabled={currentUser?.following.includes(user._id)} className='w-full py-2 rounded-md flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale:95 transition text-white cursor-pointer'> 
            <UserPlus className='w-4 h-4'/> {currentUser?.following.includes(user._id) ? 'Following' : 'Follow' }
          </button>

          {/* Connection Request Button /Message Button */}

          <button onClick={()=> handleConnectionRequest(user._id)} className='flex items-center justify-center w-16 border text-slate-500 group rounded-md cursor-pointer active:scale-95 transition'>
            {
                currentUser?.followers.includes(user._id) ? 
                <MessageCircle className='w-5 h-5 group-hover:scale-105 transition'/>
                :
                <Plus className='w-5 h-5 group-hover:scale-105 transition' />
            }
          </button>

        </div>

    </div>
  )
}

export default UserCard
