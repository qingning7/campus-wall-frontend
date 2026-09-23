import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tab = "users" | "rooms" | "strokes" | "messages";
type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isAdmin: boolean;
  school: { name: string } | null;
  _count: { wallStrokes: number; chatMessages: number; ownedRooms: number };
};
type Room = {
  id: string;
  name: string | null;
  code: string | null;
  type: "PRIVATE" | "SCHOOL";
  ownerId: string | null;
  owner: { email: string } | null;
  school: { name: string } | null;
  createdAt: string;
  _count: { wallStrokes: number; chatMessages: number; members: number };
};
type Stroke = {
  id: string;
  roomId: string;
  authorId: string;
  color: string;
  size: number;
  createdAt: string;
  author: { email: string };
  room: { name: string | null; school: { name: string } | null };
};
type Message = Omit<Stroke, "color" | "size"> & { content: string };
type Page = {
  items: (User | Room | Stroke | Message)[];
  total: number;
  page: number;
  pageSize: number;
};
type Field = {
  key: string;
  label: string;
  value: string;
  type?: "text" | "email" | "password" | "number" | "color" | "textarea";
  optional?: boolean;
  max?: number;
  min?: number;
};
type Action = {
  title: string;
  description: string;
  path: string;
  method: "POST" | "PATCH" | "DELETE";
  fields: Field[];
  targetId?: string;
  extra?: Record<string, unknown>;
};
const labels: Record<Tab, string> = {
  users: "用户",
  rooms: "房间",
  strokes: "笔触",
  messages: "聊天消息",
};
const err = (e: unknown) =>
  e instanceof Error ? e.message : "请求失败，请重试";
const date = (s: string) =>
  new Date(s).toLocaleString("zh-CN", { hour12: false });
const pathFor = (tab: Tab, id: string) =>
  `/api/admin/${tab}/${encodeURIComponent(id)}`;

function Id({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="max-w-64 break-all text-left font-mono text-xs underline decoration-dotted underline-offset-4"
      title="点击复制完整 ID"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {value}
      {copied && (
        <span className="ml-1 font-sans text-muted-foreground">已复制</span>
      )}
    </button>
  );
}

export function AdminPage() {
  const { currentUser } = useAuth();
  const [gate, setGate] = useState("loading");
  const [gateError, setGateError] = useState("");
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<Tab>("users");
  const [scope, setScope] = useState({ q: "", roomId: "" });
  function navigate(nextTab: Tab, q = "", roomId = "") {
    setScope({ q, roomId });
    setTab(nextTab);
  }
  useEffect(() => {
    const controller = new AbortController();
    setGate("loading");
    apiRequest("/api/admin/me", { auth: true, signal: controller.signal })
      .then(() => {
        if (!controller.signal.aborted) setGate("allowed");
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setGate("denied");
          setGateError(err(e));
        }
      });
    return () => controller.abort();
  }, [currentUser?.id, retry]);
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold">校园墙管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentUser?.email}
            </p>
          </div>
          <Link to="/" className="text-sm underline underline-offset-4">
            返回网站
          </Link>
        </header>
        {gate === "loading" && <p role="status">正在验证管理权限…</p>}
        {gate === "denied" && (
          <div role="alert" className="space-y-4">
            <p>{gateError}</p>
            <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
              重新检查
            </Button>
          </div>
        )}
        {gate === "allowed" && (
          <>
            <nav aria-label="管理分类" className="mb-5 flex flex-wrap gap-2">
              {(Object.keys(labels) as Tab[]).map((key) => (
                <Button
                  key={key}
                  variant={tab === key ? "default" : "outline"}
                  aria-pressed={tab === key}
                  onClick={() => navigate(key)}
                >
                  {labels[key]}
                </Button>
              ))}
            </nav>
            <Manager
              key={`${tab}:${scope.q}:${scope.roomId}`}
              tab={tab}
              adminId={currentUser!.id}
              scope={scope}
              navigate={navigate}
            />
          </>
        )}
      </div>
    </main>
  );
}

function Manager({
  tab,
  adminId,
  scope,
  navigate,
}: {
  tab: Tab;
  adminId: string;
  scope: { q: string; roomId: string };
  navigate: (tab: Tab, q?: string, roomId?: string) => void;
}) {
  const [data, setData] = useState<Page | null>(null);
  const [draft, setDraft] = useState(scope.q);
  const [roomDraft, setRoomDraft] = useState(scope.roomId);
  const [query, setQuery] = useState({ ...scope, page: 1 });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    const params = new URLSearchParams({
      q: query.q,
      page: String(query.page),
      ...(tab === "strokes" || tab === "messages"
        ? { roomId: query.roomId }
        : {}),
    });
    apiRequest<Page>(`/api/admin/${tab}?${params}`, {
      auth: true,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (
          !result.items.length &&
          query.page > 1 &&
          result.total <= (query.page - 1) * result.pageSize
        ) {
          setQuery((old) => ({
            ...old,
            page: Math.max(1, Math.ceil(result.total / result.pageSize)),
          }));
        } else setData(result);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(err(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab, query, revision]);
  const remove = (
    id: string,
    description: string,
    path = pathFor(tab, id),
    extra?: Record<string, unknown>,
  ) =>
    setAction({
      title: "确认删除",
      description,
      path,
      method: "DELETE",
      targetId: id,
      fields: [],
      extra,
    });
  const nameField = (value: string | null, label = "名称"): Field => ({
    key: "name",
    label,
    value: value ?? "",
    max: 80,
  });
  const userFields = (user?: User): Field[] => [
    {
      key: "email",
      label: "邮箱",
      type: "email",
      value: user?.email ?? "",
      max: 254,
    },
    { ...nameField(user?.name ?? "", "昵称"), optional: true },
    ...(!user
      ? [
          {
            key: "password",
            label: "初始密码（至少 8 个字符）",
            type: "password" as const,
            value: "",
            min: 8,
            max: 72,
          },
        ]
      : []),
  ];
  function create() {
    setAction(
      tab === "users"
        ? {
            title: "新增用户",
            description:
              "直接创建账号，不发送注册验证码。请将初始密码交给账号本人。",
            path: "/api/admin/users",
            method: "POST",
            fields: userFields(),
          }
        : {
            title: "新增私人房间",
            description: "使用已有用户的 ID 作为房主，邀请码自动生成。",
            path: "/api/admin/rooms",
            method: "POST",
            fields: [
              nameField(""),
              {
                key: "ownerId",
                label: "房主用户 ID",
                value: adminId,
                max: 200,
              },
              {
                key: "password",
                label: "房间密码（可留空，设置时至少 4 个字符）",
                type: "password",
                value: "",
                optional: true,
                min: 4,
                max: 72,
              },
            ],
          },
    );
  }
  const headers =
    tab === "users"
      ? [
          "用户 ID",
          "邮箱 / 昵称",
          "学校",
          "笔触 / 消息 / 房间",
          "注册时间",
          "操作",
        ]
      : tab === "rooms"
        ? [
            "房间 ID",
            "名称 / 类型",
            "邀请码 / 房主",
            "笔触 / 消息 / 成员",
            "创建时间",
            "操作",
          ]
        : tab === "messages"
          ? ["消息 ID", "房间", "作者邮箱", "内容", "发送时间", "操作"]
          : ["笔触 ID", "房间", "作者邮箱", "颜色 / 粗细", "创建时间", "操作"];
  function cells(item: User | Room | Stroke | Message): ReactNode {
    if (tab === "users") {
      const u = item as User;
      return (
        <>
          <td>
            <Id value={u.id} />
            {u.isAdmin && <p className="mt-1 text-xs">管理员</p>}
          </td>
          <td>
            <p>{u.email}</p>
            <p className="text-muted-foreground">{u.name || "—"}</p>
          </td>
          <td>{u.school?.name || "未选择"}</td>
          <td>
            {u._count.wallStrokes} / {u._count.chatMessages} /{" "}
            {u._count.ownedRooms}
          </td>
          <td className="whitespace-nowrap">{date(u.createdAt)}</td>
          <td>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("rooms", u.id)}
              >
                查看房间
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAction({
                    title: "编辑用户",
                    description: `用户：${u.id}。修改邮箱后使用新邮箱登录，请确认邮箱归属。`,
                    path: pathFor(tab, u.id),
                    method: "PATCH",
                    fields: userFields(u),
                  })
                }
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={u.isAdmin || u._count.ownedRooms > 0}
                title={
                  u.isAdmin
                    ? "不能删除管理员"
                    : u._count.ownedRooms
                      ? "请先处理该用户拥有的房间"
                      : "删除用户及其内容"
                }
                onClick={() =>
                  remove(
                    u.id,
                    `删除 ${u.email}，以及该用户的全部笔触、聊天消息和房间成员关系。此操作不可撤销。`,
                  )
                }
              >
                删除
              </Button>
            </div>
          </td>
        </>
      );
    }
    if (tab === "rooms") {
      const r = item as Room;
      return (
        <>
          <td>
            <Id value={r.id} />
          </td>
          <td>
            <p>{r.name || r.school?.name || "未命名"}</p>
            <p className="text-muted-foreground">
              {r.type === "SCHOOL" ? "学校公共房间" : "私人房间"}
            </p>
          </td>
          <td>
            <p>{r.code || "—"}</p>
            <p className="text-xs">{r.owner?.email || "—"}</p>
          </td>
          <td>
            {r._count.wallStrokes} / {r._count.chatMessages} /{" "}
            {r._count.members}
          </td>
          <td className="whitespace-nowrap">{date(r.createdAt)}</td>
          <td>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("strokes", "", r.id)}
              >
                查看笔触
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("messages", "", r.id)}
              >
                查看消息
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAction({
                    title: "编辑房间",
                    description: `房间：${r.id}`,
                    path: pathFor(tab, r.id),
                    method: "PATCH",
                    fields: [nameField(r.name || r.school?.name || "")],
                  })
                }
              >
                改名
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  remove(
                    r.id,
                    `清空「${r.name || r.school?.name || r.id}」的全部已保存笔触（当前列表统计 ${r._count.wallStrokes} 条）。保留房间和聊天，在线页面会刷新；操作期间新提交的笔触仍可能出现。`,
                    `${pathFor(tab, r.id)}/strokes`,
                  )
                }
              >
                清空画板
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={r.type === "SCHOOL"}
                title={
                  r.type === "SCHOOL"
                    ? "学校房间仅允许清空画板"
                    : "删除房间及内容"
                }
                onClick={() =>
                  remove(
                    r.id,
                    `删除房间「${r.name || r.id}」，以及全部笔触、聊天消息和成员关系。此操作不可撤销。`,
                  )
                }
              >
                删除
              </Button>
            </div>
          </td>
        </>
      );
    }
    if (tab === "messages") {
      const m = item as Message;
      return (
        <>
          <td>
            <Id value={m.id} />
          </td>
          <td>
            <p>{m.room.name || m.room.school?.name || "未命名"}</p>
            <Id value={m.roomId} />
          </td>
          <td>{m.author.email}</td>
          <td>
            <p className="min-w-48 max-w-md whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {m.content}
            </p>
          </td>
          <td className="whitespace-nowrap">{date(m.createdAt)}</td>
          <td>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAction({
                    title: "编辑消息",
                    description: `消息：${m.id}。修改后在线房间页面会刷新。`,
                    path: pathFor(tab, m.id),
                    method: "PATCH",
                    extra: { roomId: m.roomId },
                    fields: [
                      {
                        key: "content",
                        label: "消息内容",
                        type: "textarea",
                        value: m.content,
                        max: 1000,
                      },
                    ],
                  })
                }
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  remove(
                    m.id,
                    `删除 ${m.author.email} 的这条消息，所属房间：${m.roomId}。在线房间页面会刷新，此操作不可撤销。`,
                    pathFor(tab, m.id),
                    { roomId: m.roomId },
                  )
                }
              >
                删除
              </Button>
            </div>
          </td>
        </>
      );
    }
    const s = item as Stroke;
    return (
      <>
        <td>
          <Id value={s.id} />
        </td>
        <td>
          <p>{s.room.name || s.room.school?.name || "未命名"}</p>
          <Id value={s.roomId} />
        </td>
        <td>{s.author.email}</td>
        <td>
          <span
            className="mr-2 inline-block size-3 border"
            style={{ backgroundColor: s.color }}
          />
          {s.color} / {s.size}
        </td>
        <td className="whitespace-nowrap">{date(s.createdAt)}</td>
        <td>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreview(s.id)}
            >
              预览
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAction({
                  title: "编辑笔触",
                  description: `笔触：${s.id}。保留原有坐标，仅调整颜色和粗细。`,
                  path: pathFor(tab, s.id),
                  method: "PATCH",
                  extra: { roomId: s.roomId },
                  fields: [
                    {
                      key: "color",
                      label: "颜色",
                      type: "color",
                      value: s.color,
                    },
                    {
                      key: "size",
                      label: "粗细（1–48）",
                      type: "number",
                      value: String(s.size),
                      min: 1,
                      max: 48,
                    },
                  ],
                })
              }
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                remove(
                  s.id,
                  `删除此笔触，所属房间：${s.roomId}。在线画板会同步移除，此操作不可撤销。`,
                  pathFor(tab, s.id),
                  { roomId: s.roomId },
                )
              }
            >
              删除
            </Button>
          </div>
        </td>
      </>
    );
  }
  return (
    <section aria-label={`${labels[tab]}管理`}>
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setNotice("");
          setQuery({ q: draft.trim(), roomId: roomDraft.trim(), page: 1 });
        }}
      >
        <label className="min-w-64 flex-1 space-y-1 text-sm">
          <span>
            {tab === "users"
              ? "搜索邮箱、昵称或完整用户 ID"
              : tab === "rooms"
                ? "搜索房间名、学校名、邀请码、完整房间或房主 ID"
                : tab === "messages"
                  ? "搜索消息内容、完整消息 ID、作者 ID 或邮箱"
                  : "搜索完整笔触 ID、作者 ID 或邮箱"}
          </span>
          <Input
            value={draft}
            maxLength={100}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="留空查看全部"
          />
        </label>
        {(tab === "strokes" || tab === "messages") && (
          <label className="min-w-64 flex-1 space-y-1 text-sm">
            <span>限定房间 ID（可选）</span>
            <Input
              value={roomDraft}
              maxLength={200}
              onChange={(e) => setRoomDraft(e.target.value)}
            />
          </label>
        )}
        <Button type="submit">查询</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraft("");
            setRoomDraft("");
            setNotice("");
            setQuery({ q: "", roomId: "", page: 1 });
          }}
        >
          重置
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => setRevision((n) => n + 1)}
        >
          刷新
        </Button>
        {(tab === "users" || tab === "rooms") && (
          <Button type="button" variant="outline" onClick={create}>
            新增{labels[tab] === "房间" ? "私人房间" : labels[tab]}
          </Button>
        )}
      </form>
      {notice && (
        <p role="status" className="mb-3 rounded border p-3 text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-3 rounded border border-destructive p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8">
          正在加载…
        </p>
      ) : (
        data && (
          <>
            <p className="mb-2 text-xs text-muted-foreground lg:hidden">
              左右滑动表格查看完整信息和操作。
            </p>
            <div className="overflow-x-auto rounded border">
              <table className="w-full min-w-[1000px] text-left text-sm [&_td]:border-t [&_td]:px-3 [&_td]:py-3 [&_td]:align-top [&_th]:px-3 [&_th]:py-3">
                <thead className="bg-muted">
                  <tr>
                    {headers.map((h) => (
                      <th scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>{cells(item)}</tr>
                  ))}
                  {!data.items.length && (
                    <tr>
                      <td
                        colSpan={headers.length}
                        className="text-center text-muted-foreground"
                      >
                        没有符合条件的记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="mt-4 flex items-center justify-between gap-3 text-sm">
              <p>
                共 {data.total} 条 · 第 {data.page} /{" "}
                {Math.max(1, Math.ceil(data.total / data.pageSize))} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={query.page <= 1}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page * data.pageSize >= data.total}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
                >
                  下一页
                </Button>
              </div>
            </footer>
          </>
        )
      )}
      {action && (
        <ActionDialog
          action={action}
          close={() => setAction(null)}
          done={(message) => {
            setAction(null);
            setNotice(message);
            setRevision((n) => n + 1);
          }}
        />
      )}
      {preview && <StrokePreview id={preview} close={() => setPreview(null)} />}
    </section>
  );
}

function ActionDialog({
  action,
  close,
  done,
}: {
  action: Action;
  close: () => void;
  done: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const input: Record<string, unknown> = { ...action.extra };
    for (const field of action.fields)
      input[field.key] =
        field.type === "number"
          ? Number(fields.get(field.key))
          : String(fields.get(field.key) ?? "");
    if (action.targetId) input.confirmation = confirmation;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ count?: number }>(action.path, {
        auth: true,
        method: action.method,
        body: input,
      });
      done(
        result.count === undefined
          ? "操作已完成，列表已更新。"
          : `已清除 ${result.count} 条笔触，已通知在线房间页面刷新。`,
      );
    } catch (e) {
      setError(err(e));
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        className="max-h-[90svh] overflow-y-auto rounded-lg"
      >
        <DialogHeader>
          <DialogTitle>{action.title}</DialogTitle>
          <DialogDescription className="break-words">
            {action.description}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {action.fields.map((field) => (
            <label key={field.key} className="block space-y-1 text-sm">
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <Textarea
                  name={field.key}
                  defaultValue={field.value}
                  required={!field.optional}
                  disabled={busy}
                  maxLength={field.max}
                  rows={5}
                />
              ) : (
                <Input
                  name={field.key}
                  type={field.type ?? "text"}
                  defaultValue={field.value}
                  required={!field.optional}
                  disabled={busy}
                  autoComplete={
                    field.type === "password" ? "new-password" : "off"
                  }
                  min={field.type === "number" ? field.min : undefined}
                  max={field.type === "number" ? field.max : undefined}
                  minLength={field.type !== "number" ? field.min : undefined}
                  maxLength={field.type !== "number" ? field.max : undefined}
                  step={field.type === "number" ? 1 : undefined}
                />
              )}
            </label>
          ))}
          {action.targetId && (
            <label className="block space-y-2 text-sm">
              <span>输入下面完整 ID 确认操作：</span>
              <code className="block break-all rounded bg-muted p-2">
                {action.targetId}
              </code>
              <Input
                aria-label="确认目标 ID"
                value={confirmation}
                disabled={busy}
                autoComplete="off"
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={close}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant={action.method === "DELETE" ? "destructive" : "default"}
              disabled={
                busy ||
                Boolean(action.targetId && confirmation !== action.targetId)
              }
            >
              {busy
                ? "正在处理…"
                : action.method === "DELETE"
                  ? "确认删除"
                  : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StrokePreview({ id, close }: { id: string; close: () => void }) {
  const [stroke, setStroke] = useState<{
    points: { x: number; y: number }[];
    color: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<NonNullable<typeof stroke>>(pathFor("strokes", id), {
      auth: true,
      signal: controller.signal,
    })
      .then((s) => {
        if (!controller.signal.aborted) setStroke(s);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(err(e));
      });
    return () => controller.abort();
  }, [id]);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>笔触预览</DialogTitle>
          <DialogDescription className="break-all">
            {id} · 仅显示此笔触，位置对应整张画板
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert">{error}</p>
        ) : stroke ? (
          <>
            <svg
              viewBox="0 0 2400 1400"
              className="w-full rounded bg-[#30382e]"
              role="img"
              aria-label="笔触在画板中的位置"
            >
              <polyline
                points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
                stroke={stroke.color}
                strokeWidth={stroke.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <p className="text-sm">
              {stroke.points.length} 个坐标点 · {stroke.color} · 粗细{" "}
              {stroke.size}（预览不模拟压感）
            </p>
          </>
        ) : (
          <p role="status">正在加载笔触…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
