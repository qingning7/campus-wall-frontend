import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { login, register, sendEmailCode } from "../api/auth";
import { useAuth } from "../contexts/AuthContext.tsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register";

export function AuthPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const isRegister = mode === "register";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function handleSendEmailCode() {
    setError("");
    setNotice("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("请输入邮箱");
      return;
    }

    setSendingCode(true);

    try {
      const result = await sendEmailCode(normalizedEmail);
      setNotice(`验证码已发送，验证码为：${result.devCode}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");
    setLoading(true);

    const normalizedEmail = email.trim();

    try {
      if (isRegister) {
        await register({
          email: normalizedEmail,
          password,
          name: name.trim() || undefined,
          emailCode: emailCode.trim(),
        });
      }

      await login({
        email: normalizedEmail,
        password,
      });

      await refreshUser();

      navigate(isRegister ? "/school" : "/", {
        replace: true,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Campus Wall
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{isRegister ? "注册账号" : "登录账号"}</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">邮箱</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </Field>

                {isRegister && (
                  <Field>
                    <FieldLabel htmlFor="emailCode">邮箱验证码</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="emailCode"
                        value={emailCode}
                        onChange={(event) => setEmailCode(event.target.value)}
                        placeholder="输入验证码"
                        autoComplete="one-time-code"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={handleSendEmailCode}
                        disabled={sendingCode || loading}
                      >
                        {sendingCode ? "发送中..." : "发送验证码"}
                      </Button>
                    </div>
                  </Field>
                )}

                {isRegister && (
                  <Field>
                    <FieldLabel htmlFor="name">昵称</FieldLabel>
                    <Input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="输入昵称"
                      autoComplete="nickname"
                    />
                    <FieldDescription>昵称可以之后再完善。</FieldDescription>
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    required
                  />
                  {isRegister && (
                    <FieldDescription>密码至少需要 6 个字符。</FieldDescription>
                  )}
                </Field>

                {error && <FieldError>{error}</FieldError>}
                {notice && <FieldDescription>{notice}</FieldDescription>}
              </FieldGroup>
            </CardContent>

            <CardFooter className="mt-6 flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "处理中..." : isRegister ? "注册并登录" : "登录"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => switchMode(isRegister ? "login" : "register")}
                disabled={loading}
              >
                {isRegister ? "已有账号，去登录" : "没有账号，去注册"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>
    </main>
  );
}
