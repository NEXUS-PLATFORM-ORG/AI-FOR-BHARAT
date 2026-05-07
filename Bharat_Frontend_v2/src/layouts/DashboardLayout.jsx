import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Bell, Gear, Question, SignOut, UserCircle, Check, CheckCircle } from "@phosphor-icons/react"
import { fetchProfile, clearCachedProfile } from "@/lib/profileApi"
import { useNotifications } from "@/hooks/useNotifications"

function HeaderTitle({ title }) {
  const { state, isMobile } = useSidebar()
  
  if (state === "expanded" && !isMobile) return null;
  
  return (
    <h1 className="font-bold text-lg text-[#0F172A] ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
      {title}
    </h1>
  )
}

// Helper to display relative time (e.g., "5 min ago", "2 hours ago")
function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export function DashboardLayout({ 
  children, 
  sidebarItems, 
  sidebarTitle,
  userRole = "Reviewer",
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile()
        if (data) setProfile(data)
        else setProfile(null) // Handle case where profile was deleted
      } catch {
        // Profile may not exist yet, that's okay
      }
    }
    
    loadProfile()

    // Listen for custom event from ProfilePage to reload profile without refresh
    window.addEventListener("profileUpdated", loadProfile)
    
    return () => {
      window.removeEventListener("profileUpdated", loadProfile)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const displayName = profile?.full_name || user.name || "Name"
  const displayAvatar = profile?.avatar_url || ""

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    clearCachedProfile()
    navigate("/login")
  }

  const handleProfileClick = () => {
    setIsProfileOpen(false)
    if (window.location.pathname.startsWith("/admin")) {
      navigate("/admin/profile")
    } else {
      navigate("/reviewer/profile")
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 font-sans">
        <AppSidebar items={sidebarItems} title={sidebarTitle} />
        <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <header className="h-16 flex items-center justify-between bg-white border-b border-slate-200 px-4 md:px-8 shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="text-slate-500 hover:bg-slate-100" />
              <HeaderTitle title={sidebarTitle} />
            </div>
            
            {/* Right Navbar */}
            <div className="flex items-center gap-5">
              {/* Icons */}
              <div className="flex items-center gap-4 text-slate-500">
                <div className="relative" ref={notificationsRef}>
                  <button 
                    className="relative hover:text-slate-800 transition-colors cursor-pointer"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  >
                    <Bell size={24} weight="bold" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[9px] font-black text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute top-full right-0 mt-4 w-96 bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-sm text-[#0F172A]">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                          )}
                          {unreadCount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle size={12} weight="bold" /> Read All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <Bell size={32} className="text-slate-300 mx-auto mb-2" weight="duotone" />
                            <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 20).map(n => {
                            const isUnread = !n.read_at;
                            const timeAgo = getTimeAgo(n.created_at);
                            return (
                              <div
                                key={n.id}
                                onClick={() => { if (isUnread) markAsRead(n.id); }}
                                className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group ${
                                  isUnread ? 'bg-blue-50/30' : ''
                                }`}
                              >
                                <div className="flex gap-3">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    isUnread ? 'bg-blue-600' : 'bg-slate-200'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold transition-colors truncate ${
                                      isUnread
                                        ? 'text-[#0F172A] group-hover:text-blue-600'
                                        : 'text-slate-500 group-hover:text-blue-600'
                                    }`}>{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{timeAgo}</p>
                                  </div>
                                  {isUnread && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                      className="text-slate-300 hover:text-blue-600 transition-colors shrink-0 mt-1"
                                      title="Mark as read"
                                    >
                                      <Check size={14} weight="bold" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                          <span className="text-[10px] font-bold text-slate-400">{notifications.length} total notifications</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* <button className="hover:text-slate-800 transition-colors cursor-pointer">
                  <Gear size={24} weight="bold" />
                </button>
                <button className="hover:text-slate-800 transition-colors cursor-pointer">
                  <Question size={24} weight="bold" />
                </button> */}
              </div>

              {/* Separator */}
              <div className="w-[1px] h-8 bg-slate-200 mx-1"></div>

              {/* User Profile */}
              <div 
                className="relative flex items-center gap-3 cursor-pointer  transition-opacity"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                ref={profileRef}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-[#0F172A] leading-tight">{displayName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{userRole}</p>
                </div>
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt="User Avatar" 
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <UserCircle size={28} className="text-slate-400" weight="duotone" />
                  </div>
                )}

                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-slate-200 shadow-lg z-50">
                    <button 
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#0F172A] transition-colors border-l-[3px] border-transparent hover:border-[#0F172A] cursor-pointer"
                    >
                      <UserCircle size={16} weight="bold" />
                      Profile
                    </button>
                    <div className="border-t border-slate-100"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[#dc2626] transition-colors border-l-[3px] border-transparent hover:border-[#dc2626] cursor-pointer"
                    >
                      <SignOut size={16} weight="bold" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

