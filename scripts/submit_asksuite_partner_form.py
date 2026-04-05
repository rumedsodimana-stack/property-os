from playwright.sync_api import sync_playwright

CDP_URL = "http://127.0.0.1:9223"
URL = "https://asksuite.com/become-partner/"

NAME = "Rumed Sodimana"
PHONE = "+97336367850"
EMAIL = "rumedsodimana@gmail.com"
SUBJECT = "Referral and reseller partner inquiry for GCC hotel AI deployments"
WEBSITE = "https://github.com/rumedsodimana"
COMPANY = "Hotel Singularity OS"
MESSAGE = """Hi Asksuite team,

I am reaching out about your referral and reseller partner programs.

I am actively prospecting independent hotels, boutique hotels, and hotel management groups in Bahrain, the UAE, and the broader GCC with an AI reservations and concierge pilot focused on direct-booking recovery, guest messaging, and upsell revenue.

I would like to explore whether there is a fit to work with Asksuite as:

- a referral partner for hotel opportunities already in my pipeline
- a reseller or implementation partner for properties that want a hospitality-specific AI stack

If helpful, I can share the hotel segments I am targeting and the type of properties currently being approached.

Best,
Rumed Sodimana"""


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP_URL)
        page = browser.contexts[0].pages[0]
        page.goto(URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(4000)

        page.locator("#form-field-name").fill(NAME)
        page.locator("#form-field-Phone").fill(PHONE)
        page.locator("#form-field-email").fill(EMAIL)
        page.locator("#form-field-Subject").fill(SUBJECT)
        page.locator("#form-field-Website").fill(WEBSITE)
        page.locator("#form-field-Company").fill(COMPANY)
        page.locator("#form-field-Partner-0").check()
        page.locator("#form-field-Partner-1").check()
        page.locator("#form-field-Message").fill(MESSAGE)
        page.locator("#form-field-accept").check()

        page.get_by_role("button", name="Send message").click()

        success = page.get_by_text("The form was sent successfully.").or_(page.get_by_text("Thanks")).first
        success.wait_for(timeout=30000)
        print("SUBMITTED")

        try:
            browser.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
