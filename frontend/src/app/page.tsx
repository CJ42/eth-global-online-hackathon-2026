import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import styles from "./page.module.css"

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <div>
          <h1 className={styles.title}>Aqua Portfolio</h1>
          <p className={styles.subtitle}>
            Next.js + shadcn/ui. Pick a liquidity profile, then ship Aqua strategies.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Conservative, Balanced, and Aggressive profiles will live here.
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.actions}>
            <Button>Open dashboard</Button>
            <Button variant="outline">View markets</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
