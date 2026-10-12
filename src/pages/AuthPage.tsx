import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { formatError, requireSupabase } from "../lib/data";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  loginSchema,
  registerSchema,
  type LoginFields,
  type RegisterFields,
} from "../validations/forms";

const passwordUpdateSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});
type PasswordUpdateFields = z.infer<typeof passwordUpdateSchema>;
type AuthFields = LoginFields | RegisterFields | PasswordUpdateFields;
type AuthMode = "login" | "register" | "recover" | "updatePassword" | "confirmEmail";

export default function AuthPage({
  register = false,
  recovery = false,
}: {
  register?: boolean;
  recovery?: boolean;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPath = searchParams.get("next");
  const returnPath =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/account";
  const [mode, setMode] = useState<AuthMode>(
    recovery ? "updatePassword" : register ? "register" : "login",
  );
  const [notice, setNotice] = useState<{
    message: string;
    success: boolean;
  } | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const schema =
    mode === "register"
      ? registerSchema
      : mode === "updatePassword"
        ? passwordUpdateSchema
        : loginSchema;
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFields>({
    resolver: zodResolver(schema) as Resolver<AuthFields>,
  });

  const submit = async (values: AuthFields) => {
    setNotice(null);
    try {
      const client = requireSupabase();
      if (mode === "updatePassword") {
        const details = values as PasswordUpdateFields;
        const { error } = await client.auth.updateUser({
          password: details.password,
        });
        if (error) throw error;
        setNotice({
          message: "Password updated. You can continue to your account.",
          success: true,
        });
        navigate(returnPath);
        return;
      }
      if (mode === "recover") {
        const details = values as LoginFields;
        const { error } = await client.auth.resetPasswordForEmail(
          details.email,
          {
            redirectTo: `${window.location.origin}/reset-password?recovery=1`,
          },
        );
        if (error) throw error;
        setNotice({
          message:
            "If an account exists for that email, a password reset link has been sent.",
          success: true,
        });
        return;
      }
      if (mode === "register") {
        const details = values as RegisterFields;
        const { data, error } = await client.auth.signUp({
          email: details.email,
          password: details.password,
          options: {
            data: { full_name: details.name, phone: details.phone ?? "" },
            emailRedirectTo: `${window.location.origin}${returnPath}`,
          },
        });
        if (error) throw error;
        if (data.session) navigate(returnPath);
        else {
          setPendingEmail(details.email);
          setOtpCode("");
          setMode("confirmEmail");
          setNotice({
            message: `Enter the verification code we sent to ${details.email}.`,
            success: true,
          });
        }
        return;
      }
      const details = values as LoginFields;
      const { error } = await client.auth.signInWithPassword({
        email: details.email,
        password: details.password,
      });
      if (error) throw error;
      navigate(returnPath);
    } catch (error) {
      setNotice({ message: formatError(error), success: false });
    }
  };

  const verifyEmailCode = async () => {
    setNotice(null);
    setIsVerifying(true);
    try {
      const client = requireSupabase();
      const { error } = await client.auth.verifyOtp({
        email: pendingEmail,
        token: otpCode,
        type: "signup",
      });
      if (error) throw error;
      navigate(returnPath);
    } catch (error) {
      setNotice({ message: formatError(error), success: false });
    } finally {
      setIsVerifying(false);
    }
  };

  const resendEmailCode = async () => {
    setNotice(null);
    setIsResending(true);
    try {
      const client = requireSupabase();
      const { error } = await client.auth.resend({
        type: "signup",
        email: pendingEmail,
      });
      if (error) throw error;
      setNotice({
        message: `A new code was sent to ${pendingEmail}.`,
        success: true,
      });
    } catch (error) {
      setNotice({ message: formatError(error), success: false });
    } finally {
      setIsResending(false);
    }
  };

  const title =
    mode === "register"
      ? "Make room for a trip."
      : mode === "confirmEmail"
        ? "Check your inbox."
        : mode === "updatePassword"
          ? "Choose a new password."
          : mode === "recover"
            ? "Reset your password."
            : "Welcome back.";

  return (
    <section className="form-page">
      <div className="form-panel">
        <span className="eyebrow">
          <LockKeyhole size={13} /> YOUR TRAVEXGO ACCOUNT
        </span>
        <h1>{title}</h1>
        <p>
          {mode === "register"
            ? "Create an account to request bookings and keep your trip details together."
            : mode === "confirmEmail"
              ? `Enter the six-digit code sent to ${pendingEmail}.`
              : mode === "updatePassword"
                ? "Set a new password for your TravexGo account."
                : mode === "recover"
                  ? "We’ll send a secure reset link to your email address."
                  : "Sign in to see your bookings and travel updates."}
        </p>
        {!isSupabaseConfigured && (
          <div className="form-notice">
            Supabase is not configured yet. Add credentials to{" "}
            <strong>.env.local</strong> to enable account access.
          </div>
        )}
        {notice && (
          <div
            className={`form-notice ${notice.success ? "success" : ""}`}
            role="status"
          >
            {notice.message}
          </div>
        )}
        {mode === "confirmEmail" ? (
          <>
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                void verifyEmailCode();
              }}
              noValidate
            >
              <label>
                Email verification code
                <input
                  className="field-control"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) =>
                    setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                />
              </label>
              <button
                className="button button-dark"
                disabled={isVerifying || otpCode.length !== 6}
              >
                {isVerifying ? "Verifying…" : "Verify email"}{" "}
                <ArrowRight size={15} />
              </button>
            </form>
            <p className="form-alt">
              Didn’t receive a code?{" "}
              <button
                className="inline-button"
                type="button"
                onClick={() => void resendEmailCode()}
                disabled={isResending}
              >
                {isResending ? "Sending…" : "Resend code"}
              </button>
            </p>
          </>
        ) : (
          <form
            className="form-stack"
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            {mode === "register" && (
              <>
                <label>
                  Full name
                  <input
                    className="field-control"
                    autoComplete="name"
                    {...field("name" as never)}
                  />
                  {"name" in errors && errors.name && (
                    <span className="form-error">{errors.name.message}</span>
                  )}
                </label>
                <label>
                  Phone number{" "}
                  <span style={{ fontWeight: 400 }}>(optional)</span>
                  <input
                    className="field-control"
                    type="tel"
                    autoComplete="tel"
                    {...field("phone" as never)}
                  />
                </label>
              </>
            )}
            {mode !== "updatePassword" && (
              <label>
                Email address
                <input
                  className="field-control"
                  type="email"
                  autoComplete="email"
                  {...field("email" as never)}
                />
                {"email" in errors && errors.email && (
                  <span className="form-error">{errors.email.message}</span>
                )}
              </label>
            )}
            {mode !== "recover" && (
              <label>
                Password
                <input
                  className="field-control"
                  type="password"
                  autoComplete={
                    mode === "register" || mode === "updatePassword"
                      ? "new-password"
                      : "current-password"
                  }
                  {...field("password" as never)}
                />
                {errors.password && (
                  <span className="form-error">{errors.password.message}</span>
                )}
              </label>
            )}
            <button
              className="button button-dark"
              disabled={isSubmitting || !isSupabaseConfigured}
            >
              {isSubmitting
                ? "Please wait…"
                : mode === "register"
                  ? "Create account"
                  : mode === "recover"
                    ? "Send reset link"
                    : mode === "updatePassword"
                      ? "Update password"
                      : "Sign in"}{" "}
              <ArrowRight size={15} />
            </button>
          </form>
        )}
        {mode === "login" && (
          <p className="form-alt">
            <button
              className="inline-button"
              onClick={() => {
                setMode("recover");
                setNotice(null);
              }}
            >
              Forgot password?
            </button>
          </p>
        )}
        <p className="form-alt">
          {mode === "register" ? (
            <>
              Already have an account?{" "}
              <Link to={`/login?next=${encodeURIComponent(returnPath)}`}>
                Sign in
              </Link>
            </>
          ) : mode === "updatePassword" ? (
            <span>Password reset is complete after this update.</span>
          ) : mode === "recover" ? (
            <button className="inline-button" onClick={() => setMode("login")}>
              <ArrowLeft size={13} /> Back to sign in
            </button>
          ) : (
            <>
              New to TravexGo?{" "}
              <Link to={`/register?next=${encodeURIComponent(returnPath)}`}>
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </section>
  );
}