import { useEffect, useState } from 'react'
import { Eye, MessageSquare, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import API from '../api/api'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { socket } from '../utils/socket'

const Messages = () => {
  const [connections, setConnections] = useState([])
  const [groups, setGroups] = useState([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [groupPhoto, setGroupPhoto] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()

  const getConnections = async () => {
    try {
      const { data } = await API.get(`/users/${user._id}/getconnections`, { withCredentials: true })
      setConnections(data)
    } catch (error) {
      console.log(error)
    }
  }

  const getGroups = async () => {
    try {
      const res = await API.get(`/group/groups/user/${user._id}`, { withCredentials: true })
      setGroups(res.data.groups)
    } catch (error) {
      console.log(error)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const formData = new FormData()
      formData.append('name', groupName)
      formData.append('description', groupDescription)
      formData.append('members', JSON.stringify(selectedMembers))
      if (groupPhoto) {
        formData.append('file', groupPhoto)
      }

      const { data } = await API.post('/group/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })

      setGroups(prev => [data.group, ...prev])
      setShowGroupModal(false)
      setGroupName('')
      setGroupDescription('')
      setSelectedMembers([])
      setGroupPhoto(null)
      toast.success('Group created successfully!')
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  useEffect(() => {
    getConnections()
    getGroups()

    socket.connect();
    socket.emit('register', user._id);
    socket.emit('get-online-users');
    socket.on('online-users', (onlineUsers) => {
      console.log('Online users:', onlineUsers);
      setOnlineUsers(onlineUsers);
    });
    return () => {
      socket.off('online-users');
    }
  }, [])

  // Helper function to check if a group has any online members
  const isGroupOnline = (group) => {
    return group.members.some(memberId => onlineUsers.includes(memberId));
  }

  return (
    <div className='min-h-screen relative bg-gradient-to-b from-slate-50 to-gray-100'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title and Create Group Button */}
        <div className='mb-8 flex justify-between items-center'>
          <div>
            <h1 className='text-4xl font-extrabold text-slate-900 mb-2 tracking-tight'>
              Messages
            </h1>
            <p className='text-slate-600 text-lg'>
              Connect with friends, family, and groups
            </p>
          </div>
          <button
            onClick={() => setShowGroupModal(true)}
            className='group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md'
          >
            <Users className='w-5 h-5 group-hover:animate-pulse' />
            <span className='font-medium'>Create a Group</span>
          </button>
        </div>

        {/* Groups Section */}
        {groups.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-2xl font-bold text-slate-900 mb-4'>Your Groups</h2>
            <div className='flex flex-col gap-4'>
              {groups.map((group) => (
                <div
                  key={group._id}
                  className='max-w-xl flex items-center gap-5 p-5 bg-white shadow-lg rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]'
                >
                  <div className='relative'>
                    <img
                      src={group.photo || "https://res.cloudinary.com/dczqoleux/image/upload/v1760852684/group_photos/default_group.png"}
                      alt={group.name}
                      className='rounded-full size-14 object-cover border-2 border-blue-200'
                    />
                    {isGroupOnline(group) && (
                      <span className='absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></span>
                    )}
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-slate-800 text-lg'>{group.name}</p>
                    <p className='text-slate-500 text-sm'>{group.description || 'No description'}</p>
                    <p className='text-sm text-gray-600 mt-1'>Members: {group.members.length}</p>
                  </div>
                  <div className='flex gap-3'>
                    <button
                      onClick={() => navigate(`/messages/group/${group._id}`)}
                      className='size-10 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 active:scale-95 transition-all duration-200'
                    >
                      <MessageSquare className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Users Section */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-2xl font-bold text-slate-900 mb-4'>Your Connections</h2>
          {connections.map((user) => (
            <div
              key={user._id}
              className='max-w-xl flex items-center gap-5 p-5 bg-white shadow-lg rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]'
            >
              <div className='relative'>
                <img
                  src={user.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"}
                  alt=""
                  className='rounded-full size-14 object-cover'
                />
                {onlineUsers.includes(user._id) && (
                  <span className='absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></span>
                )}
              </div>
              <div className='flex-1'>
                <p className='font-semibold text-slate-800 text-lg'>{user.fullname}</p>
                <p className='text-slate-500 text-sm'>@{user.fullname}</p>
                <p className='text-sm text-gray-600 mt-1'>{user.bio || 'No bio'}</p>
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={() => navigate(`/messages/${user._id}`)}
                  className='size-10 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 active:scale-95 transition-all duration-200'
                >
                  <MessageSquare className='w-5 h-5' />
                </button>
                <button
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className='size-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all duration-200'
                >
                  <Eye className='w-5 h-5' />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Group Creation Modal */}
        {showGroupModal && (
          <div className='fixed inset-0 bg-gradient-to-br from-gray-900/80 to-blue-900/80 flex items-center justify-center z-50 animate-fade-in'>
            <div className='bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100 hover:scale-[1.02]'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold text-slate-900'>Create a New Group</h2>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className='p-2 rounded-full hover:bg-gray-100 text-slate-600 transition-all duration-200'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Group Name</label>
                  <input
                    type='text'
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    placeholder='Enter group name'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Description</label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                    placeholder='Describe your group (optional)'
                    rows='4'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>Group Photo</label>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => setGroupPhoto(e.target.files[0])}
                      className='w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>Add Members</label>
                  <div className='max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50'>
                    {connections.map((user) => (
                      <div
                        key={user._id}
                        className='flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer'
                        onClick={() => handleMemberToggle(user._id)}
                      >
                        <input
                          type='checkbox'
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => handleMemberToggle(user._id)}
                          className='h-5 w-5 text-blue-600 rounded focus:ring-blue-500'
                        />
                        <div className='relative'>
                          <img
                            src={user.profilePics || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"}
                            alt=""
                            className='rounded-full size-10 object-cover'
                          />
                          {onlineUsers.includes(user._id) && (
                            <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
                          )}
                        </div>
                        <span className='text-slate-700 font-medium'>{user.fullname}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='flex justify-end gap-3'>
                  <button
                    type='button'
                    onClick={() => setShowGroupModal(false)}
                    className='px-5 py-2 text-slate-600 rounded-lg hover:bg-gray-100 transition-all duration-200'
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2'
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <svg className='animate-spin h-5 w-5 text-white' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z' />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }
        `}
      </style>
    </div>
  )
}

export default Messages