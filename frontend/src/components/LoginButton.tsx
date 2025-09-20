import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

const LoginButton: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginWithRedirect({
        authorizationParams: {
          login_hint: email,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleSocialLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2'
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/90 via-violet-50/70 to-purple-50/80 relative overflow-hidden">
      {/* Blue hues top-left */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-400/12 via-blue-400/6 to-transparent rounded-full blur-2xl animate-pulse"></div>
      
      {/* Violet hues bottom-right */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-violet-400/15 via-purple-300/8 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-tl from-purple-400/12 via-violet-400/6 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      
      {/* Floating elements */}
      <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce delay-300"></div>
      <div className="absolute top-1/3 right-1/5 w-1 h-1 bg-violet-400/50 rounded-full animate-bounce delay-700"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-purple-400/40 rounded-full animate-bounce delay-500"></div>
      
      {/* Additional floating dots */}
      <div className="absolute top-1/6 right-1/6 w-1.5 h-1.5 bg-blue-300/35 rounded-full animate-bounce delay-1200"></div>
      <div className="absolute top-2/5 left-1/8 w-1 h-1 bg-purple-300/45 rounded-full animate-bounce delay-400"></div>
      <div className="absolute bottom-1/6 left-1/3 w-2.5 h-2.5 bg-violet-300/30 rounded-full animate-bounce delay-900"></div>
      <div className="absolute bottom-2/5 right-1/8 w-1.5 h-1.5 bg-cyan-300/40 rounded-full animate-bounce delay-600"></div>
      <div className="absolute top-1/2 left-1/12 w-1 h-1 bg-blue-400/45 rounded-full animate-bounce delay-1400"></div>
      <div className="absolute top-3/5 right-1/12 w-2 h-2 bg-purple-400/35 rounded-full animate-bounce delay-800"></div>
      <div className="absolute bottom-1/5 right-2/5 w-1 h-1 bg-violet-400/40 rounded-full animate-bounce delay-1100"></div>
      <div className="absolute top-1/8 left-2/5 w-1.5 h-1.5 bg-cyan-400/35 rounded-full animate-bounce delay-1300"></div>
      
      {/* More floating dots */}
      <div className="absolute top-1/12 right-1/4 w-1 h-1 bg-blue-400/50 rounded-full animate-bounce delay-1600"></div>
      <div className="absolute top-4/5 left-1/6 w-2 h-2 bg-purple-300/40 rounded-full animate-bounce delay-200"></div>
      <div className="absolute bottom-1/8 right-1/6 w-1.5 h-1.5 bg-violet-400/45 rounded-full animate-bounce delay-1500"></div>
      <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-cyan-400/50 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute top-1/10 left-1/5 w-2.5 h-2.5 bg-blue-300/30 rounded-full animate-bounce delay-1700"></div>
      <div className="absolute bottom-1/12 left-1/8 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-bounce delay-300"></div>
      <div className="absolute top-2/3 left-1/20 w-1 h-1 bg-violet-300/45 rounded-full animate-bounce delay-1800"></div>
      <div className="absolute bottom-3/5 right-1/10 w-2 h-2 bg-cyan-300/35 rounded-full animate-bounce delay-700"></div>
      <div className="absolute top-7/8 right-2/5 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-bounce delay-1900"></div>
      <div className="absolute bottom-1/10 right-1/20 w-1 h-1 bg-purple-400/50 rounded-full animate-bounce delay-100"></div>
      
      {/* Animated sparkles */}
      <div className="absolute top-1/5 left-1/3 text-blue-400/30 animate-pulse delay-200">
        <Sparkles size={16} />
      </div>
      <div className="absolute bottom-1/5 right-1/4 text-violet-400/30 animate-pulse delay-800">
        <Sparkles size={12} />
      </div>
      
      <div className="glass-card p-8 w-full max-w-md text-center relative z-10">
        <div className="mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-violet-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-violet-400/20 rounded-3xl blur animate-pulse"></div>
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-violet-800 bg-clip-text text-transparent mb-3">
            DocLess
          </h1>
          <p className="text-gray-600 font-medium">Professional Patient Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 w-5 h-5 transition-colors group-focus-within:text-blue-500 z-10" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 placeholder-gray-400 text-gray-800 transition-all duration-200 hover:bg-gray-50"
              required
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 w-5 h-5 transition-colors group-focus-within:text-blue-500 z-10" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 placeholder-gray-400 text-gray-800 transition-all duration-200 hover:bg-gray-50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 via-purple-500 to-violet-600 hover:from-blue-600 hover:via-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <LogIn size={20} />
            )}
            {isLoading ? 'Signing In...' : 'Sign In Securely'}
          </button>
        </form>
        
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">or continue with</span>
            </div>
          </div>
          
          <button
            onClick={handleSocialLogin}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p className="flex items-center justify-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Enterprise-grade security & authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginButton;
