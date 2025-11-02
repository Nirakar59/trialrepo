import { useState, useEffect } from 'react'
import {Users, UserPlus, UserCheck, UserRoundPen, MessageSquare} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import API from '../api/api'
const Connections = () => {

  const [currentTab, setCurrentTab] = useState('Followers')
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [connections, setConnections] = useState([])
  const [pendingConnections, setPendingConnections] = useState([])
  const {user} = useAuth()
const navigate = useNavigate()

const getFollowers = async () => {
  try {
    const {data} = await API.get(`/users/${user._id}/followers`, {withCredentials: true})
    setFollowers(data)
  } catch (error) {
    console.log(error)
  }
}

const getFollowing = async () => {
  try {
    const {data} = await API.get(`/users/${user._id}/following`, {withCredentials: true})
    setFollowing(data)
  } catch (error) {
    console.log(error)
  }
}

const getConnections = async () => {
  try {
    const {data} = await API.get(`/users/${user._id}/getconnections`, {withCredentials: true})
    setConnections(data)
  } catch (error) {
    console.log(error)
  }
}

const getPendingConnectionRequests = async () => {
  try {
    const {data} = await API.get(`/users/${user._id}/pendingconnections`, {withCredentials: true})
    setPendingConnections(data)
  } catch (error) {
    console.log(error)
  }
}

const unfollowUser = async (userId) => {
  try {
    await API.put(`/users/${userId}/unfollow`, {}, {withCredentials: true})
    getFollowing()
  } catch (error) {
    console.log(error)
  }
}

const acceptConnection = async (userId) => {
  try {
    await API.post(`/users/${userId}/acceptrequest`, {}, {withCredentials: true})
    getConnections()
    getPendingConnectionRequests()
  } catch (error) {
    console.log(error)
  }
}

useEffect(() => {
  getFollowers()
  getFollowing()
  getConnections()
  getPendingConnectionRequests()
}, [])

const dataArray = [
  {label: 'Followers', value: followers, icon: Users},
  {label: 'Following', value: following, icon: UserCheck},
  {label: 'Pending', value: pendingConnections, icon: UserRoundPen},
  {label: 'Connections', value: connections, icon: UserPlus},
]

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6'>
             
      {/* Title */}
      <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Connections</h1>
          <p className='text-slate-600'>Manage your network and discover new connections</p>
      </div>
             {/* Counts */}
             <div className='mb-8 flex flex-wrap gap-6'>
              {dataArray.map((item, index)=>(
                <div key={index} className='flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md'>
                  <b>{item.value.length}</b>
                  <p className='text-slate-600'>{item.label}</p>
                </div>
              
              ))}
             </div>

             {/* Tabs */}

             <div className='inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm'>
                 {
                  dataArray.map((tab)=>(
                    <button onClick={()=> setCurrentTab(tab.label)} key={tab.label} className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${currentTab === tab.label ? 'bg-white font-medium text-black' : 'text-gray-500 hover:text-black'}`}>
                      <tab.icon className='w-4 h-4'/>
                      <span className='ml-1'>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className='ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full'>{tab.count}</span>
                      )}
                    </button>
                  ))
                 }
             </div>

              {/* Connections */}
              <div className='flex flex-wrap gap-6 mt-6'>
                   {dataArray.find((item)=>item.label === currentTab).value.map((user)=>(
                    <div key={Math.random() } className='w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-md'>
                      <img src={user.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"} alt="" className="rounded-full w-12 h-12 shadow-md mx-auto"/>
                      <div className='flex-1'>
                        <p className='font-medium text-slate-700'>{user.fullname}</p>
                        <p className='text-slate-500'>@{user.fullname}</p>
                        <p className='text-sm text-gray-600'>{user.bio.slice(0, 30)}This is a bio</p>
                        <div className='flex max-sm:flex-col gap-2 mt-4'>
                            {
                              <button onClick={()=> navigate(`/profile/${user._id}`)} className='w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer'>
                                     View Profile
                              </button>
                            }

                            {
                               currentTab === 'Following' && (
                                <button onClick={()=> unfollowUser(user._id)} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>
                                  Unfollow
                                </button>
                               )
                            }

                           {
                               currentTab === 'Pending' && (
                                <button onClick={()=> acceptConnection(user._id)} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>
                                  Accept
                                </button>
                               )
                            }

                            {
                               currentTab === 'Connections' && (
                                <button onClick={()=> navigate(`/messages/${user._id}`)} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1'>
                                  <MessageSquare className='w-4 h-4'/>
                                  Message
                                </button>
                               )
                            }

                        </div>
                      </div>
                    </div>
                   ))}
              </div>

      </div>
    </div>
  )
}

export default Connections
