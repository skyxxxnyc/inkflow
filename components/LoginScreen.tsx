import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password || (!isLogin && !name)) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            
            // Generate a stable ID based on email so data persists for this "user"
            const simpleHash = (str: string) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = (hash << 5) - hash + char;
                    hash = hash & hash;
                }
                return Math.abs(hash).toString(16);
            };

            const userId = simpleHash(email.toLowerCase().trim());

            // Create dummy user
            const user: User = {
                id: userId,
                email,
                name: isLogin ? email.split('@')[0] : name,
                avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`
            };
            
            onLogin(user);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-nb-bg dark:bg-nb-darkBg flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-nb-paper dark:bg-nb-darkPaper border-4 border-black dark:border-white shadow-neo p-8 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black mx-auto flex items-center justify-center mb-4 shadow-neo-sm transform -rotate-6">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">InkFlow AI</h1>
                    <p className="text-gray-500 font-serif italic">Your proactive thought partner.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider ml-1">Full Name</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo outline-none transition-shadow font-medium"
                                placeholder="J.R.R. Tolkien"
                            />
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider ml-1">Email Address</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo outline-none transition-shadow font-medium"
                            placeholder="writer@inkflow.ai"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider ml-1">Password</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black focus:shadow-neo outline-none transition-shadow font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-nb-red/20 border-2 border-nb-red text-red-600 text-xs font-bold uppercase">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-lg shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {isLogin ? 'Sign In' : 'Get Started'} <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-xs font-bold uppercase underline decoration-2 underline-offset-4 hover:text-nb-purple transition-colors"
                    >
                        {isLogin ? "Need an account? Create one" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};