import { type FormEvent, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  changePassword,
  sendPasswordResetCode,
  resetPasswordByEmail,
} from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetByEmail, setResetByEmail] = useState(false);
  const { currentUser } = useAuth();
  const [emailCode, setEmailCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setError("");
    setNotice("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("请填写所有密码字段");
      return;
    }

    if (newPassword.length < 6) {
      setError("新密码至少需要 6 个字符");
      return;
    }

    if (newPassword === currentPassword) {
      setError("新密码不能与当前密码相同");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setSaving(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setNotice(result.message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "密码修改失败，请稍后重试",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSendResetCode() {
    if (sendingCode || saving) return;

    setError("");
    setNotice("");
    setSendingCode(true);

    try {
      const result = await sendPasswordResetCode();
      setNotice(result.message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "发送验证码失败，请稍后重试",
      );
    } finally {
      setSendingCode(false);
    }
  }

  async function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || sendingCode) return;

    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(emailCode.trim())) {
      setError("请输入六位数字验证码");
      return;
    }

    if (newPassword.length < 6) {
      setError("新密码至少需要 6 个字符");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("新密码过长，请控制在 72 字节以内");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setSaving(true);

    try {
      const result = await resetPasswordByEmail({
        emailCode: emailCode.trim(),
        newPassword,
      });

      setEmailCode("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setNotice(result.message);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "密码重置失败，请稍后重试",
      );
    } finally {
      setSaving(false);
    }
  }

  if (resetByEmail) {
    return (
      <section className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">重置密码</h1>
          <p className="text-sm text-muted-foreground">
            通过邮箱验证重置密码。
          </p>
        </div>
        <form onSubmit={handleResetSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-email">绑定邮箱</FieldLabel>
              <Input
                id="reset-email"
                type="email"
                value={currentUser?.email ?? ""}
                readOnly
                aria-describedby="reset-email-description"
              />
              <FieldDescription id="reset-email-description">
                验证码将发送至当前账号绑定的邮箱。
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="reset-email-code">邮箱验证码</FieldLabel>

              <div className="flex gap-2">
                <Input
                  id="reset-email-code"
                  name="emailCode"
                  className="min-w-0 flex-1"
                  placeholder="输入验证码"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  required
                  disabled={saving}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={sendingCode || saving}
                  onClick={handleSendResetCode}
                >
                  {sendingCode ? "发送中..." : "发送验证码"}
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="reset-new-password">新密码</FieldLabel>

              <InputGroup>
                <InputGroupInput
                  id="reset-new-password"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="输入新密码，至少 6 个字符"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={saving}
                  required
                  className="[&::-ms-reveal]:hidden"
                />

                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={showNewPassword ? "隐藏新密码" : "显示新密码"}
                    title={showNewPassword ? "隐藏新密码" : "显示新密码"}
                    disabled={saving}
                    onClick={() => setShowNewPassword((visible) => !visible)}
                  >
                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="reset-confirm-password">
                确认新密码
              </FieldLabel>

              <InputGroup>
                <InputGroupInput
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="再次输入新密码"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={saving}
                  required
                  className="[&::-ms-reveal]:hidden"
                />

                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={
                      showConfirmPassword ? "隐藏确认新密码" : "显示确认新密码"
                    }
                    title={
                      showConfirmPassword ? "隐藏确认新密码" : "显示确认新密码"
                    }
                    disabled={saving}
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>

          {error && <FieldError role="alert">{error}</FieldError>}

          {notice && (
            <FieldDescription role="status">{notice}</FieldDescription>
          )}
          <Button type="submit" disabled={saving || sendingCode}>
            {saving ? "重置中..." : "重置密码"}
          </Button>
        </form>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={() => {
            setEmailCode("");
            setNewPassword("");
            setConfirmPassword("");
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setError("");
            setNotice("");
            setResetByEmail(false);
          }}
          disabled={sendingCode || saving}
        >
          返回更改密码
        </Button>
      </section>
    );
  }
  return (
    <section
      className="w-full max-w-md space-y-8"
      aria-labelledby="change-password-title"
    >
      <div className="space-y-2">
        <h1
          id="change-password-title"
          className="text-2xl font-semibold tracking-tight"
        >
          更改密码
        </h1>
        <p className="text-sm text-muted-foreground">
          输入当前密码，并设置新的登录密码。
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="current-password">当前密码</FieldLabel>

            <InputGroup>
              <InputGroupInput
                id="current-password"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="输入当前密码"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="[&::-ms-reveal]:hidden"
                disabled={saving}
              />

              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label={
                    showCurrentPassword ? "隐藏当前密码" : "显示当前密码"
                  }
                  title={showCurrentPassword ? "隐藏当前密码" : "显示当前密码"}
                  onClick={() => setShowCurrentPassword((visible) => !visible)}
                >
                  {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <Button
              type="button"
              variant="link"
              className="h-auto w-fit! self-end p-0 text-xs"
              disabled={saving}
              onClick={() => {
                setError("");
                setNotice("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                setResetByEmail(true);
              }}
            >
              忘记密码？
            </Button>
          </Field>
          <Field>
            <FieldLabel htmlFor="new-password">新密码</FieldLabel>

            <InputGroup>
              <InputGroupInput
                id="new-password"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="输入新密码，至少 6 个字符"
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                className="[&::-ms-reveal]:hidden"
                disabled={saving}
              />

              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label={showNewPassword ? "隐藏新密码" : "显示新密码"}
                  title={showNewPassword ? "隐藏新密码" : "显示新密码"}
                  onClick={() => setShowNewPassword((visible) => !visible)}
                  disabled={saving}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">确认新密码</FieldLabel>

            <InputGroup>
              <InputGroupInput
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="再次输入新密码"
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="[&::-ms-reveal]:hidden"
                disabled={saving}
              />

              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label={
                    showConfirmPassword ? "隐藏确认新密码" : "显示确认新密码"
                  }
                  title={
                    showConfirmPassword ? "隐藏确认新密码" : "显示确认新密码"
                  }
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>

        {error && <FieldError role="alert">{error}</FieldError>}

        {notice && <FieldDescription role="status">{notice}</FieldDescription>}

        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存新密码"}
        </Button>
      </form>
    </section>
  );
}
