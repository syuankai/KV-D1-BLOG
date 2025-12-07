import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, PlusSquare, Home, User } from 'lucide-react';

// API Configuration
const API_BASE_URL = '/api'; // 假設 /api 路由到 Cloudflare Worker

// Utility Function for API Calls
const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
    
    // 處理 204 No Content
    if (response.status === 204) {
        return null;
    }

    // 嘗試解析 JSON，即使是非 2xx 狀態，Worker 也可能返回 JSON 錯誤
    let data = {};
    try {
        data = await response.json();
    } catch (e) {
        // 如果無法解析 JSON，返回一個通用錯誤
        throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
    }
    
    if (!response.ok) {
        throw new Error(data.error || 'API 請求失敗');
    }
    return data;
};

// --- 組件: 導航欄 ---
const NavBar = ({ user, currentView, setCurrentView, logout, loading }) => (
    <nav className="bg-gray-800 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                    <span 
                        className="text-2xl font-bold cursor-pointer text-indigo-400 hover:text-indigo-300 transition duration-150"
                        onClick={() => setCurrentView({ name: 'list' })}
                    >
                        Kai's Blog
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setCurrentView({ name: 'list' })}
                        className={`p-2 rounded-full transition duration-150 ${currentView.name === 'list' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                        title="首頁"
                        disabled={loading}
                    >
                        <Home className="w-6 h-6" />
                    </button>

                    {user && user.role === 'admin' && (
                        <button 
                            onClick={() => setCurrentView({ name: 'create' })}
                            className={`p-2 rounded-full transition duration-150 ${currentView.name === 'create' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                            title="新增文章"
                            disabled={loading}
                        >
                            <PlusSquare className="w-6 h-6" />
                        </button>
                    )}
                    
                    {user ? (
                        <>
                            <div className="flex items-center space-x-1 text-sm bg-gray-700 p-2 rounded-full">
                                <User className="w-4 h-4 text-green-400" />
                                <span>{user.username} ({user.role === 'admin' ? '管理員' : '用戶'})</span>
                            </div>
                            <button 
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-full flex items-center transition duration-150"
                                disabled={loading}
                            >
                                <LogOut className="w-5 h-5 mr-1" />
                                登出
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setCurrentView({ name: 'login' })}
                            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-full transition duration-150 ${currentView.name === 'login' || currentView.name === 'register' ? 'bg-indigo-700' : ''}`}
                            disabled={loading}
                        >
                            登入/註冊
                        </button>
                    )}
                </div>
            </div>
        </div>
    </nav>
);

// --- 組件: 訊息或錯誤顯示 ---
const Message = ({ type, text, onClose }) => {
    if (!text) return null;
    const baseClasses = "p-4 mb-4 rounded-lg shadow-md flex justify-between items-center";
    let colorClasses = "";
    switch (type) {
        case 'success':
            colorClasses = "bg-green-100 border border-green-400 text-green-700";
            break;
        case 'error':
            colorClasses = "bg-red-100 border border-red-400 text-red-700";
            break;
        case 'info':
        default:
            colorClasses = "bg-blue-100 border border-blue-400 text-blue-700";
    }

    return (
        <div className={`${baseClasses} ${colorClasses}`} role="alert">
            <span className="block sm:inline">{text}</span>
            {onClose && (
                <button onClick={onClose} className="text-xl font-semibold leading-none opacity-70 hover:opacity-100 ml-4">
                    &times;
                </button>
            )}
        </div>
    );
};


// --- 組件: 登入/註冊表單 ---
const AuthForm = ({ type, setUser, setCurrentView, setMessage, loading, setLoading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const isLogin = type === 'login';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const endpoint = isLogin ? '/login' : '/register';
            const data = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            
            localStorage.setItem('token', data.user.token);
            setUser(data.user);
            setCurrentView({ name: 'list' });
            setMessage({ type: 'success', text: data.message });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || '操作失敗' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">{isLogin ? '用戶登入' : '用戶註冊'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        用戶名
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        id="username"
                        type="text"
                        placeholder="請輸入用戶名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        密碼
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        id="password"
                        type="password"
                        placeholder="******************"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="flex flex-col items-center justify-between">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline w-full transition duration-150 disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (isLogin ? '登入中...' : '註冊中...') : (isLogin ? '登入' : '註冊')}
                    </button>
                    <button
                        type="button"
                        className="inline-block align-baseline font-bold text-sm text-indigo-500 hover:text-indigo-800 mt-4"
                        onClick={() => setCurrentView({ name: isLogin ? 'register' : 'login' })}
                        disabled={loading}
                    >
                        {isLogin ? '還沒有帳號？去註冊' : '已經有帳號？去登入'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- 組件: 文章列表 ---
const PostList = ({ posts, setCurrentView, loading }) => {
    return (
        <div className="max-w-4xl mx-auto mt-8 space-y-6">
            <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-8 border-b-2 pb-2">最新文章</h2>
            
            {loading && (
                <div className="text-center p-10 text-gray-500">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full"></div>
                    <p className="mt-2">正在加載文章...</p>
                </div>
            )}

            {!loading && posts.length === 0 && (
                <div className="text-center p-10 text-gray-500 border-dashed border-2 rounded-lg">
                    <p className="text-lg">目前沒有任何文章。管理員可以點擊 '+' 創建新文章。</p>
                </div>
            )}

            {!loading && posts.map(post => (
                <div 
                    key={post.id} 
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-0.5 border border-gray-100 cursor-pointer"
                    onClick={
                        // 確保點擊時，傳遞 post.id 給 detail 視圖
                        () => setCurrentView({ name: 'detail', id: post.id })
                    }
                >
                    <h3 className="text-2xl font-bold text-indigo-600 mb-2 truncate">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>作者: {post.author_name}</span>
                        <span>發布於: {new Date(post.created_at).toLocaleDateString('zh-TW')}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- 組件: 單篇文章詳情 ---
const PostDetail = ({ postId, setCurrentView, setMessage, loading, setLoading }) => {
    const [post, setPost] = useState(null);
    const [error, setError] = useState(null);

    const fetchPost = useCallback(async () => {
        if (!postId) return; // 避免在沒有 ID 時運行

        setLoading(true);
        setError(null);
        setPost(null);
        setMessage({ type: '', text: '' });

        try {
            // 確保 API 呼叫的 URL 中包含了正確的 ID
            const data = await apiFetch(`/posts/${postId}`, { method: 'GET' });
            
            if (data.post) {
                setPost(data.post);
            } else {
                setError("文章載入失敗：無效的響應格式。");
            }
        } catch (err) {
            console.error("Fetch Post Error:", err);
            setError(err.message || '文章未找到或已被刪除。');
            setMessage({ type: 'error', text: err.message || '文章未找到或已被刪除。' });
        } finally {
            setLoading(false);
        }
    }, [postId, setLoading, setMessage]);

    useEffect(() => {
        if (postId) {
            fetchPost();
        }
    }, [postId, fetchPost]);

    if (loading) {
        return (
            <div className="text-center p-20 text-gray-500">
                <div className="animate-spin inline-block w-10 h-10 border-4 border-t-blue-500 border-gray-200 rounded-full"></div>
                <p className="mt-4">正在載入文章詳情...</p>
            </div>
        );
    }
    
    // 如果沒有 ID 且不在載入中，可能是導航錯誤，返回列表
    if (!postId && !loading) {
        setCurrentView({ name: 'list' });
        return null;
    }

    if (error || !post) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8 bg-red-50 rounded-xl shadow-lg border border-red-200 text-center">
                <h2 className="text-3xl font-bold text-red-600 mb-4">錯誤</h2>
                <p className="text-lg text-red-700">{error || "文章未找到或載入失敗。"}</p>
                <button 
                    onClick={() => setCurrentView({ name: 'list' })}
                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition duration-150"
                >
                    返回文章列表
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-2xl border border-gray-200">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 border-b pb-2">{post.title}</h1>
            <div className="text-sm text-gray-500 mb-6 flex justify-between">
                <span>作者: <span className="font-semibold text-indigo-600">{post.author_name}</span></span>
                <span>發布於: {new Date(post.created_at).toLocaleString('zh-TW')}</span>
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
            </div>
            <button 
                onClick={() => setCurrentView({ name: 'list' })}
                className="mt-8 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full transition duration-150"
            >
                &larr; 返回列表
            </button>
        </div>
    );
};

// --- 組件: 創建文章 ---
const CreatePost = ({ user, setCurrentView, setMessage, loading, setLoading }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (!title.trim() || !content.trim()) {
            setMessage({ type: 'error', text: '標題和內容不能為空！' });
            setLoading(false);
            return;
        }

        try {
            const data = await apiFetch('/posts', {
                method: 'POST',
                body: JSON.stringify({ title, content }),
            });
            
            setMessage({ type: 'success', text: `文章發布成功: ${data.title}` });
            setCurrentView({ name: 'list' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || '發布文章失敗' });
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8 bg-red-100 rounded-xl shadow-lg border border-red-300 text-center text-red-700">
                <h2 className="text-2xl font-bold mb-3">權限不足</h2>
                <p>只有管理員才能發布新文章。</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">創建新文章</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                        文章標題
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        id="title"
                        type="text"
                        placeholder="請輸入文章標題"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                        文章內容
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight h-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
                        id="content"
                        placeholder="請輸入文章內容..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline w-full max-w-xs transition duration-150 disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? '發布中...' : '發布文章'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- 主應用程式組件 ---
const App = () => {
    // 狀態管理
    const [user, setUser] = useState(null);
    // currentView: { name: 'list' | 'login' | 'register' | 'create' | 'detail', id: number | null }
    const [currentView, setCurrentView] = useState({ name: 'list', id: null });
    const [posts, setPosts] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // 登出功能
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setCurrentView({ name: 'list' });
        setMessage({ type: 'info', text: '您已成功登出。' });
    };
    
    // 檢查本地存儲是否有 token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    // 檢查 token 格式正確性，並設置用戶狀態
                    setUser({ username: parts[0], role: parts[1] });
                } else {
                    localStorage.removeItem('token');
                }
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
    }, []);

    // 獲取文章列表
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const data = await apiFetch('/posts', { method: 'GET' });
            // 確保 data.posts 是一個陣列
            setPosts(Array.isArray(data.posts) ? data.posts : []);
        } catch (error) {
            console.error("Fetch Posts Error:", error);
            setMessage({ type: 'error', text: error.message || '無法獲取文章列表。' });
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 僅在視圖是 'list' 時獲取文章列表，並在頁面載入時觸發一次
        if (currentView.name === 'list') {
            fetchPosts();
        }
    }, [currentView.name, fetchPosts]);


    const renderContent = () => {
        switch (currentView.name) {
            case 'login':
            case 'register':
                return (
                    <AuthForm 
                        type={currentView.name} 
                        setUser={setUser} 
                        setCurrentView={setCurrentView} 
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                    />
                );
            case 'create':
                return (
                    <CreatePost 
                        user={user} 
                        setCurrentView={setCurrentView} 
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                    />
                );
            case 'detail':
                return (
                    <PostDetail 
                        postId={currentView.id} 
                        setCurrentView={setCurrentView} 
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                    />
                );
            case 'list':
            default:
                return (
                    <PostList 
                        posts={posts} 
                        setCurrentView={setCurrentView} 
                        loading={loading}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased">
            <NavBar 
                user={user} 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                logout={logout}
                loading={loading}
            />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Message type={message.type} text={message.text} onClose={() => setMessage({ type: '', text: '' })} />
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
