import { defineBoot } from '#q-app/wrappers'
import { useAuthStore } from 'stores/auth-store'
import { Notify } from 'quasar'

// Idle timeout dalam milidetik (15 menit = 900000ms)
// Anda bisa mengubah nilai ini sesuai kebutuhan
const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 menit

// Warning sebelum logout (2 menit sebelum timeout)
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000 // 2 menit

export default defineBoot(({ router }) => {
    let idleTimer = null
    let warningTimer = null
    let isWarningShown = false

    // Events yang dianggap sebagai aktivitas user
    const activityEvents = [
        'mousedown',
        'mousemove',
        'keydown',
        'scroll',
        'touchstart',
        'click',
        'wheel'
    ]

    /**
     * Reset idle timer saat ada aktivitas
     */
    function resetIdleTimer() {
        const authStore = useAuthStore()

        // Hanya jalankan jika user sudah login
        if (!authStore.isAuthenticated) {
            clearTimers()
            return
        }

        // Clear existing timers
        clearTimers()

        // Set warning timer (muncul 2 menit sebelum logout)
        warningTimer = setTimeout(() => {
            if (authStore.isAuthenticated && !isWarningShown) {
                isWarningShown = true
                Notify.create({
                    type: 'warning',
                    message: 'Sesi akan berakhir dalam 2 menit karena tidak ada aktivitas',
                    caption: 'Gerakkan mouse atau tekan tombol untuk tetap login',
                    timeout: 30000,
                    position: 'top',
                    actions: [
                        {
                            label: 'Tetap Login',
                            color: 'white',
                            handler: () => {
                                resetIdleTimer()
                            }
                        }
                    ]
                })
            }
        }, IDLE_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS)

        // Set logout timer
        idleTimer = setTimeout(async () => {
            if (authStore.isAuthenticated) {
                // Logout user
                await authStore.logout()

                Notify.create({
                    type: 'negative',
                    message: 'Sesi telah berakhir',
                    caption: 'Anda telah logout otomatis karena tidak ada aktivitas selama 15 menit',
                    timeout: 5000,
                    position: 'top'
                })

                // Redirect ke halaman login
                if (router.currentRoute.value.path !== '/login') {
                    router.replace('/login')
                }
            }
        }, IDLE_TIMEOUT_MS)

        // Reset warning flag
        isWarningShown = false
    }

    /**
     * Clear all timers
     */
    function clearTimers() {
        if (idleTimer) {
            clearTimeout(idleTimer)
            idleTimer = null
        }
        if (warningTimer) {
            clearTimeout(warningTimer)
            warningTimer = null
        }
    }

    /**
     * Throttle function untuk mengurangi frekuensi reset timer
     * (tidak perlu reset setiap milidetik mouse bergerak)
     */
    function throttle(func, limit) {
        let inThrottle
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args)
                inThrottle = true
                setTimeout(() => (inThrottle = false), limit)
            }
        }
    }

    // Throttled reset (minimal 1 detik antara reset)
    const throttledReset = throttle(resetIdleTimer, 1000)

    /**
     * Start monitoring idle activity
     */
    function startIdleMonitoring() {
        // Tambahkan event listeners
        activityEvents.forEach((event) => {
            document.addEventListener(event, throttledReset, { passive: true })
        })

        // Start timer pertama kali
        resetIdleTimer()
    }

    /**
     * Stop monitoring idle activity
     */
    function stopIdleMonitoring() {
        // Hapus event listeners
        activityEvents.forEach((event) => {
            document.removeEventListener(event, throttledReset)
        })

        // Clear timers
        clearTimers()
    }

    // Watch for auth state changes
    // Start monitoring when logged in, stop when logged out
    const authStore = useAuthStore()

    // Initial check
    if (authStore.isAuthenticated) {
        startIdleMonitoring()
    }

    // Watch for route changes to detect login/logout
    router.afterEach((to) => {
        const authStore = useAuthStore()

        if (to.path === '/login' || !authStore.isAuthenticated) {
            stopIdleMonitoring()
        } else if (authStore.isAuthenticated) {
            startIdleMonitoring()
        }
    })

    // Watch for storage changes (untuk mendeteksi logout dari tab lain)
    window.addEventListener('storage', (event) => {
        if (event.key === 'token' && !event.newValue) {
            stopIdleMonitoring()
        }
    })

    // Expose untuk debugging (opsional)
    if (import.meta.env.DEV) {
        window.__idleTimeout = {
            reset: resetIdleTimer,
            start: startIdleMonitoring,
            stop: stopIdleMonitoring,
            getTimeoutMs: () => IDLE_TIMEOUT_MS
        }
    }
})
