import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
Progress

export default function Home() {
  return (
      <div className="p-4">
      <div className="flex flex-col gap-y-4">
        <div>
          <Button variant="elevated">
                      this is not a button
          </Button>
        </div>
        <div>
          <Input placeholder="I am an input"/> 
        </div>
        <div>
          <Progress value={50}/>
        </div>
        <div>
          <Textarea placeholder={"I am a text area"}/>
        </div>
        <div>
          <Checkbox/>
        </div>
      </div>
      </div>
  );
}
