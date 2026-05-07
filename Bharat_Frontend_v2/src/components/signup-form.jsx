import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Warning } from "@phosphor-icons/react"
import { API_AUTH } from "../lib/apiConfig.js"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export function SignupForm({
  className,
  ...props
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_AUTH}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign up");
      }

      // Redirect to login after successful signup
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {error && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-white border border-slate-200 border-l-[4px] border-l-red-500 shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 min-w-[300px]">
          <Warning size={20} className="text-red-600 shrink-0" weight="bold" />
          <div>
            <p className="text-[14px] font-bold text-slate-900 leading-tight">Registration Failed</p>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}
      <Card className="bg-white border-slate-200 shadow-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold text-slate-900">Create an account</CardTitle>
          <CardDescription className="text-slate-500">
            Sign up to get started or continue with Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Button 
                variant="outline" 
                type="button" 
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`
                    }
                  });
                  if (error) setError(error.message);
                }}
                className="w-full bg-white text-slate-900 border-slate-200 hover:bg-slate-50 h-10 font-normal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-slate-200">
                <span className="relative z-10 bg-white px-2 text-slate-500">
                  Or continue with email
                </span>
              </div>

              <Field>
                <FieldLabel htmlFor="name" className="text-slate-900">Full Name</FieldLabel>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400 focus-visible:border-slate-400"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="text-slate-900">Email</FieldLabel>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400 focus-visible:border-slate-400 ${error ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-slate-200'}`}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="text-slate-900">Password</FieldLabel>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400 focus-visible:border-slate-400"
                />
              </Field>
              <Field className="pt-2">
                <Button type="submit" disabled={loading} className="w-full bg-slate-900 text-white hover:bg-slate-800 h-10 disabled:opacity-50">
                  {loading ? "Signing up..." : "Sign up"}
                </Button>
                <FieldDescription className="text-center mt-4 text-slate-500">
                  Already have an account? <Link to="/login" className="text-slate-900 hover:underline">Login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-slate-500 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-slate-900">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
