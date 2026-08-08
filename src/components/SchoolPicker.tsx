import { useEffect, useState } from "react";
import { bindMySchool, type AuthUser } from "../api/auth";
import { getSchools, type School } from "../api/school";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type SchoolPickerProps = {
  onSelected: (user: AuthUser) => void;
};

export function SchoolPicker({ onSelected }: SchoolPickerProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingSchoolId, setSavingSchoolId] = useState("");
  const [error, setError] = useState("");

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

  const keyword = search.trim().toLowerCase();

  const filteredSchools = keyword
    ? schools
        .filter((school) => school.name.toLowerCase().includes(keyword))
        .slice(0, 9)
    : [];

  async function handleSelectSchool(schoolId: string) {
    setError("");
    setSavingSchoolId(schoolId);

    try {
      const updatedUser = await bindMySchool(schoolId);
      onSelected(updatedUser);
    } catch (error) {
      setError(error instanceof Error ? error.message : "绑定学校失败");
    } finally {
      setSavingSchoolId("");
    }
  }

  const hasKeyword = search.trim().length > 0;
  const shouldShowList = hasKeyword && !loading;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col items-center justify-center">
        <div className="w-full space-y-6">
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
                  <CommandList className="absolute top-full left-0 right-0 z-20 mt-3 max-h-72 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
                    {filteredSchools.length ? (
                      filteredSchools.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.name}
                          disabled={savingSchoolId === school.id}
                          onSelect={() => handleSelectSchool(school.id)}
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
    </main>
  );
}
