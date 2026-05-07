import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@phosphor-icons/react";
import { API_AUTH } from "../lib/apiConfig.js";

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing authentication...");

  useEffect(() => {
    // Listen for the SIGNED_IN event which fires when Supabase
    // automatically picks up the #access_token from the URL hash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Clean the token fragment from the URL immediately
          window.history.replaceState({}, document.title, window.location.pathname);

          try {
            setStatus("Setting up your account...");

            const email = session.user.email;
            const name =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              email.split("@")[0];

            // Call our backend to create/login the user and issue our own JWT
            const response = await fetch(`${API_AUTH}/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, name }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Backend authentication failed");
            }

            // Save backend token and user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === "admin") {
              navigate("/admin/dashboard", { replace: true });
            } else {
              navigate("/reviewer/dashboard", { replace: true });
            }
          } catch (err) {
            console.error("Auth callback error:", err);
            setStatus("Authentication failed. Redirecting...");
            setTimeout(() => navigate("/login", { replace: true }), 1500);
          }
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire within 10 seconds
    // (e.g. session was already processed), try getSession directly.
    const fallbackTimer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("No session found after timeout, redirecting to login.");
          navigate("/login", { replace: true });
        }
        // If session exists, onAuthStateChange should have already handled it.
      } catch {
        navigate("/login", { replace: true });
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={32} className="animate-spin text-slate-400" />
        <p className="text-slate-500 font-medium">{status}</p>
      </div>
    </div>
  );
}
