import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.tsx";
import { bindMySchool } from "../api/auth";
import { getSchools, type School } from "../api/school";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const SCHOOL_PAGE_SIZE = 9;

export function SchoolPage() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingSchoolId, setSavingSchoolId] = useState("");
  const [error, setError] = useState("");
  const [pendingSchool, setPendingSchool] = useState<School | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [visibleSchoolCount, setVisibleSchoolCount] =
    useState(SCHOOL_PAGE_SIZE);

  useEffect(() => {
    async function loadSchools() {
      try {
        const data = await getSchools();
        setSchools(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "加载学校列表失败");
      } finally {
        setLoading(false);
      }
    }

    loadSchools();
  }, []);
  // 处理弹窗
  useEffect(() => {
    if (!confirmOpen || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [confirmOpen, countdown]);

  function closeConfirmDialog() {
    setConfirmOpen(false);
    setPendingSchool(null);
    setCountdown(5);
  }

  async function handleConfirmBind() {
    if (!pendingSchool) return;
    await handleSelectSchool(pendingSchool.id);
    closeConfirmDialog();
  }

  const keyword = search.trim().toLowerCase();

  const matchedSchools = keyword
    ? schools.filter((school) => school.name.toLowerCase().includes(keyword))
    : [];
  const visibleSchools = matchedSchools.slice(0, visibleSchoolCount);

  useEffect(() => {
    setVisibleSchoolCount(SCHOOL_PAGE_SIZE);
  }, [keyword]);

  function handleSchoolListScroll(event: React.UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    const distanceToBottom = list.scrollHeight - list.scrollTop - list.clientHeight;

    if (distanceToBottom > 24) {
      return;
    }

    setVisibleSchoolCount((currentCount) =>
      Math.min(currentCount + SCHOOL_PAGE_SIZE, matchedSchools.length),
    );
  }

  if (!currentUser) {
    return null;
  }

  if (currentUser.schoolId) {
    return <Navigate to="/" replace />;
  }

  async function handleSelectSchool(schoolId: string) {
    setError("");
    setSavingSchoolId(schoolId);

    try {
      const updatedUser = await bindMySchool(schoolId);
      setCurrentUser(updatedUser);
      navigate("/", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "绑定学校失败");
    } finally {
      setSavingSchoolId("");
    }
  }

  const hasKeyword = search.trim().length > 0;
  const shouldShowList = hasKeyword;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col items-center justify-center">
        <div className="w-full space-y-6">
          <Button
            type="button"
            variant="ghost"
            className="mb-3 w-full"
            onClick={() => navigate("/")}
          >
            暂时不绑定，先逛逛-{">"}
          </Button>
          <h1 className="text-center text-3xl font-semibold tracking-normal">
            绑定学校
          </h1>

          <div className="mx-auto w-full max-w-md">
            <div className="relative">
              <Command
                shouldFilter={false}
                className="overflow-visible bg-transparent p-0 shadow-none"
              >
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="搜索学校"
                  className="h-12"
                />

                {shouldShowList && (
                  <CommandList
                    className="absolute top-full left-0 right-0 z-20 mt-3 max-h-72 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg"
                    onScroll={handleSchoolListScroll}
                  >
                    {loading ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        加载中...
                      </div>
                    ) : visibleSchools.length ? (
                      visibleSchools.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.name}
                          disabled={savingSchoolId === school.id}
                          onSelect={() => {
                            setConfirmOpen(true);
                            setPendingSchool(school);
                            setCountdown(5);
                          }}
                        >
                          {savingSchoolId === school.id
                            ? "绑定中..."
                            : school.name}
                        </CommandItem>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        未找到匹配的学校
                      </div>
                    )}
                    {visibleSchools.length < matchedSchools.length && (
                      <div className="px-4 py-2 text-center text-xs text-muted-foreground">
                        正在加载...
                      </div>
                    )}
                  </CommandList>
                )}
              </Command>
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
        </div>
      </section>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认绑定学校</AlertDialogTitle>
            <AlertDialogDescription>
              选择学校后将无法更改，是否确认绑定
              {pendingSchool ? `“${pendingSchool.name}”` : ""}？
            </AlertDialogDescription>
          </AlertDialogHeader>

          <p className="text-sm text-muted-foreground">
            {countdown > 0 ? `${countdown} 秒后才可操作` : ""}
          </p>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              disabled={countdown > 0 || !pendingSchool || !!savingSchoolId}
              onClick={handleConfirmBind}
            >
              {savingSchoolId ? "绑定中..." : "确认"}
            </AlertDialogAction>

            <AlertDialogCancel
              disabled={countdown > 0}
              onClick={() => {
                setConfirmOpen(false);
                setPendingSchool(null);
                setCountdown(5);
              }}
            >
              重新选择
            </AlertDialogCancel>

            <button
              type="button"
              disabled={countdown > 0}
              onClick={() => {
                closeConfirmDialog();
                navigate("/");
              }}
              className="w-full text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              之后再选
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
