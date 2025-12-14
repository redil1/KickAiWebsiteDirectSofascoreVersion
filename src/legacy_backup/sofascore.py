import requests
import json
import datetime
import os
import asyncio
import nodriver as uc

# helper to fetch JSON via nodriver browser
def fetch_json_via_nodriver(url):
    async def _fetch():
        browser = None
        try:
            # Configure browser options for headless operation on server
            browser_args = [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--headless=new',
                '--no-first-run',
                '--disable-extensions',
                '--disable-default-apps',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
            
            # Try to find chromium binary
            possible_paths = [
                '/snap/bin/chromium',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable'
            ]
            
            browser_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    browser_path = path
                    break
            
            if browser_path:
                browser = await uc.start(
                    browser_executable_path=browser_path, 
                    browser_args=browser_args, 
                    no_sandbox=True,
                    headless=True
                )
            else:
                browser = await uc.start(
                    browser_args=browser_args, 
                    no_sandbox=True,
                    headless=True
                )
                
            page = await browser.get(url)
            # Wait for page to load
            await page.sleep(3)
            
            # Get page content
            content = await page.get_content()
            
            # Extract JSON from HTML if wrapped
            if content and content.strip().startswith('<html>'):
                # Look for JSON content within <pre> tags
                import re
                json_match = re.search(r'<pre[^>]*>(.*?)</pre>', content, re.DOTALL)
                if json_match:
                    content = json_match.group(1).strip()
                    print(f"Extracted JSON from HTML wrapper, length: {len(content)}")
                else:
                    print("Warning: HTML response but no JSON found in <pre> tags")
            
            print(f"Final content length: {len(content) if content else 0}")
            return content
            
        except Exception as e:
            print(f"Error in browser automation: {e}")
            raise
        finally:
            # Proper cleanup - stop() is synchronous, not async
            if browser:
                try:
                    browser.stop()
                    print("Browser stopped successfully")
                except Exception as e:
                    print(f"Warning: Error stopping browser: {e}")
    
    try:
        # Try to get the current event loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is running, use asyncio.run_coroutine_threadsafe
            import concurrent.futures
            import threading
            
            def run_in_thread():
                return asyncio.run(_fetch())
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(run_in_thread)
                return future.result()
        else:
            return loop.run_until_complete(_fetch())
    except RuntimeError:
        # No event loop, create a new one
        return asyncio.run(_fetch())

def get_football_categories():

    url = "https://www.sofascore.com/api/v1/sport/football/categories/all"

    # fetch JSON via browser automation
    raw = fetch_json_via_nodriver(url)
    data = json.loads(raw)
    with open('football_categories.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, indent=4, ensure_ascii=False))
    print("Football categories saved to football_categories.json")
    return data

def get_football_live_categories():
    """
    This function fetches football live categories from the SofaScore API and saves them to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    # Example url: https://www.sofascore.com/api/v1/sport/football/live-categories
    # Example player id: 187753

    url = "https://www.sofascore.com/api/v1/sport/football/live-categories"

    # fetch JSON via browser automation
    raw = fetch_json_via_nodriver(url)
    data = json.loads(raw)
    with open('football_live_categories.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, indent=4, ensure_ascii=False))
    print("Football live categories saved to football_live_categories.json")
    return data

def get_football_tournaments():
    """
    This function fetches football tournaments from the SofaScore API and saves them to a JSON file.
    """
    # URL for the SofaScore API endpoint
    url = "https://www.sofascore.com/api/v1/search/suggestions/unique-tournaments"

    querystring = { "sport": "football" }

    # fetch JSON via browser automation
    full_url = url + "?sport=football"
    raw = fetch_json_via_nodriver(full_url)
    data = json.loads(raw)
    with open('football_tournaments.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, indent=4, ensure_ascii=False))
    print("Football tournements saved to football_tournaments.json")
    return data

def get_tournament_featured_events(tournament_id):
    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/featured-events"



    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",

        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _gid=GA1.2.848260054.1746704814; _sharedID=33e6ba26-af4c-49fb-b08c-edb85ac456c6; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=z160Z182NHREYVVsZ3Y1SiUyRnIwdlBOZnRYTVhiaG4xcHAwM3BBTDNPJTJGbUVGR21tMEdTSGpxYWdqV0dVWEhwcXRaU1hHSkV2a0xwRXZzamZiRXZTU2dPbmpxYnFRZkZHb3pFTlBpMnVZTjYzZVpnOUUlM0Q; _ga=GA1.1.2057756329.1746703005; exco-uid=s1doc7gv5zl2c54s; pbjs-unifiedid=%7B%22TDID%22%3A%2259f6c2fa-6291-4757-a5b4-7090ca0fe0aa%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-08T12%3A47%3A18%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; FCNEC=%5B%5B%22AKsRol9OezXa5Fpj_hJpooacIrsbDv24Eh8GRPhOZzpz_TroahIYyeLnck_ZcA1nrnQuaTHPKK_HJ0jROYlfeVAOb0pGlsEgPAVThFAZdPDwWUWSytNam1vm_KsKdSZDdgpoLRejFcoOA5Gg-saZ07wopunuAqDX5Q%3D%3D%22%5D%5D; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746710719:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746710719:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746710719:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; cto_bundle=NpZd4V9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpSUFZYenlTRmw1JTJCekUyTEEyWGJxZ0VJdUhtd0dkVHk1dlFVRDJyUmhra1RkOEdzQnBPb3FVQzRPd1ZHaENkMzMlMkZtWkNpNTUzd25pU2Z5dkp6d1UyVG5PaUFzanB4M3N1aXdBRFlUdUYlMkJoeU1yeXNoRTEweCUyRjd1SVBiSmNneDBnJTNEJTNE; _awl=2.1746710722.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; _ga_FVWZ0RM4DH=GS2.1.s1746710828$o2$g0$t1746710828$j60$l0$h0; _ga_HNQ9P9MGZR=GS2.1.s1746703005$o1$g1$t1746710828$j14$l0$h0"
    }

    # fetch JSON via browser automation
    raw = fetch_json_via_nodriver(url)
    data = json.loads(raw)
    filename = f"tournament_featured_events_{tournament_id}.json"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=4, ensure_ascii=False))
    print(filename)

def get_football_suggestions():
    """
    This function fetches football suggestions from the SofaScore API and saves them to a JSON file.
    """
    # URL for the SofaScore API endpoint

    url = "https://www.sofascore.com/api/v1/search/suggestions/default"

    querystring = { "sport": "football" }

    # fetch JSON via browser automation
    full_url = url + "?sport=football"
    raw = fetch_json_via_nodriver(full_url)
    data = json.loads(raw)
    with open('football_suggestions.json', 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, indent=4, ensure_ascii=False))
    print("Football suggestions saved to football_suggestions.json")
    return data

def get_football_trending_players():
    """
    This function fetches trending football players from the SofaScore API and saves them to a JSON file.
    """
    # URL for the SofaScore API endpoint

    url = "https://www.sofascore.com/api/v1/sport/football/trending-top-players"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "a2af6a116f89edcb171407b4e037f131-999239e22726feb2",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "67227c",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=a2af6a116f89edcb171407b4e037f131",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        with open('trending_players.json', 'w', encoding='utf-8') as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        print("trending_players saved to football_categories.json")
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

def get_scheduled_events(date):
    """
    This function fetches scheduled football events from the SofaScore API and saves them to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    url = f"https://www.sofascore.com/api/v1/sport/football/scheduled-events/{date}"    #2025-05-08

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "a2af6a116f89edcb171407b4e037f131-999239e22726feb2",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "67227c",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=a2af6a116f89edcb171407b4e037f131",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)
    if response.status_code == 200:
        with open('scheduled_events.json', 'w', encoding='utf-8') as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        print("scheduled_events saved to football_categories.json")
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

def get_player_heatmap(event_id,player_id):
    """
    This function fetches player heatmap data from the SofaScore API and saves it to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    url = f"https://www.sofascore.com/api/v1/event/{event_id}/player/{player_id}/heatmap"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "a2af6a116f89edcb171407b4e037f131-999239e22726feb2",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "67227c",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=a2af6a116f89edcb171407b4e037f131",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        with open('get_player_heatmap.json', 'w', encoding='utf-8') as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        print("get_player_heatmap saved to football_categories.json")
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

def get_newly_added_events():
    """
    This function fetches newly added football events from the SofaScore API and saves them to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    url = "https://www.sofascore.com/api/v1/event/newly-added-events"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "a2af6a116f89edcb171407b4e037f131-999239e22726feb2",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "67227c",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=a2af6a116f89edcb171407b4e037f131",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "lotame_domain_check=sofascore.com; _cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice"
    }

    #download the image
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        with open('newly_added_events.json', 'w', encoding='utf-8') as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        print("newly_added_events saved to football_categories.json")
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None
    
def download_player_image(player_id):
    """
    This function fetches player image from the SofaScore API and saves it to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    # Example url: https://img.sofascore.com/api/v1/player/187753/image
    # Example player id: 187753     

    url = f"https://img.sofascore.com/api/v1/player/{player_id}/image"

    headers = {
        "host": "img.sofascore.com",
        "connection": "keep-alive",
        "sec-ch-ua-platform": "\"Windows\"",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-dest": "image",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "lotame_domain_check=sofascore.com; _cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice"
    }

    #download the image
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)
    if response.status_code == 200:
        with open(f'player_{player_id}.png', 'wb') as f:
            f.write(response.content)
        print(f"Player image saved to player_{player_id}.png")
        #image path
        image_path = f'player_{player_id}.png'  
        return image_path        
    else:
        print(f"Error: {response.status_code}")
        return None

def download_manager_image(manager_id):
    """
    This function fetches manager image from the SofaScore API and saves it to a PNG file.
    """
    # URL for the SofaScore API endpoint
    # Example url: https://img.sofascore.com/api/v1/manager/795501/image

    url = f"https://img.sofascore.com/api/v1/manager/{manager_id}/image"

    headers = {
        "host": "img.sofascore.com",
        "connection": "keep-alive",
        "sec-ch-ua-platform": "\"Windows\"",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-dest": "image",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "lotame_domain_check=sofascore.com; _cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice"
    }

    # download the image
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)
    if response.status_code == 200:
        with open(f'manager_{manager_id}.png', 'wb') as f:
            f.write(response.content)
        print(f"Manager image saved to manager_{manager_id}.png")
        # image path
        image_path = f'manager_{manager_id}.png'
        return image_path
    else:
        print(f"Error: {response.status_code}")
        return None
    
def download_team_image_full(team_id):  
    """
    This function fetches team image from the SofaScore API and saves it to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    # Example url: https://img.sofascore.com/api/v1/team/295766/image
    # Example team id: 295766     

    url = f"https://img.sofascore.com/api/v1/team/{team_id}/image"

    headers = {
        "host": "img.sofascore.com",
        "connection": "keep-alive",
        "sec-ch-ua-platform": "\"Windows\"",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-dest": "image",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "lotame_domain_check=sofascore.com; _cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice"
    }

    #download the image
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)
    if response.status_code == 200:
        with open(f'player_{team_id}.png', 'wb') as f:
            f.write(response.content)
        print(f"Player image saved to player_{team_id}.png")
        #image path
        image_path = f'player_{team_id}.png'  
        return image_path        
    else:
        print(f"Error: {response.status_code}")
        return None

def download_team_image_small(team_id):  
    """
    This function fetches team image from the SofaScore API and saves it to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    # Example url: https://img.sofascore.com/api/v1/team/38/image/small
    # Example team id: 38

    url = f"https://img.sofascore.com/api/v1/team/{team_id}/image/small"

    headers = {
        "host": "img.sofascore.com",
        "connection": "keep-alive",
        "sec-ch-ua-platform": "\"Windows\"",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-dest": "image",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "lotame_domain_check=sofascore.com; _cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice"
    }

    #download the image
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)
    if response.status_code == 200:
        with open(f'player_{team_id}_small.png', 'wb') as f:
            f.write(response.content)
        print(f"Player image saved to player_{team_id}_small.png")
        #image path
        image_path = f'player_{team_id}_small.png'  
        return image_path

def download_tournament_image(tournament_id):
    """
    This function fetches tournament image from the SofaScore API and saves it to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    # Example url: https://img.sofascore.com/api/v1/unique-tournament/7/image
    # Example tournament id: 7  



    url = f"https://img.sofascore.com/api/v1/unique-tournament/{tournament_id}/image"

    headers = {
        "host": "img.sofascore.com",
        "connection": "keep-alive",
        "sec-ch-ua-platform": "\"Windows\"",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-dest": "image",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "lotame_domain_check=sofascore.com; _cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice"
    }

    #download the image
    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)
    if response.status_code == 200:
        with open(f'tournament_{tournament_id}.png', 'wb') as f:
            f.write(response.content)
        print(f"Tournament image saved to tournament_{tournament_id}.png")
        #image path
        image_path = f'tournament_{tournament_id}.png'  
        return image_path        
    
    else:
        print(f"Error: {response.status_code}")
        return None

def get_event_count():
    """
    This function fetches event count from the SofaScore API and saves it to a JSON file.
    """
    # URL for the SofaScore API endpoint

    # Example date: 2025-05-08

    # 12587018 is the event id, 187753 is the player id

    # Example url: https://www.sofascore.com/api/v1/sport/-18000/event-count
    # Example event id: -18000

    url = "https://www.sofascore.com/api/v1/sport/-18000/event-count"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "a2af6a116f89edcb171407b4e037f131-999239e22726feb2",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "67227c",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=a2af6a116f89edcb171407b4e037f131",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_retry_request=true; _lr_env_src_ats=false; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746703003:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746703003:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746703003:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _ga=GA1.1.2057756329.1746703005; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _awl=2.1746703011.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; FCNEC=%5B%5B%22AKsRol8eDdBx-NbJc7j-eSjFRWou6O3tyaW44G5Js11tNgt4KbE7pmKnoTWrxAPDYDgHc0lg38L16q-1mPLigvKrlh4skSYnshWbw2CrHfQpbGD9ytMAsm0FdrIeZjGPq0PAN4E1rzA06oJGX6UW3vFGE8Bmd5B0Pw%3D%3D%22%5D%5D; cto_bundle=tEB5ll9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpxOHB4c3V0ayUyQlhEWjhCME8lMkJJV3V5WUlEdmJKS0ZpSzZJZGx1d09tMWdPMk94SExOTkc0RkRBdDltcmtEcnlXWHBQUlBiVDJPaEY3WUFLa2dOQjNYd3doMTlSZDJXemV5aVZhYmM1dElIUUxIalJBdDFFZTBIczN6aGhBcGU0VHclM0QlM0Q"
    }

    # fetch JSON via browser automation
    response = requests.get(url, headers=headers)

    print(response.text)
    if response.status_code == 200:
        with open('event_count.json', 'w', encoding='utf-8') as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        print("event_count saved to football_categories.json")
        return response.json()
    
    else:
        print(f"Error: {response.status_code}")
        return None

def get_tournament_schedule(tournament_id, season_id):

    """
    Fetches the tournament schedule for a given tournament and season ID from SofaScore API.
    Args:
        tournament_id (int): The ID of the tournament.
        season_id (int): The ID of the season.
    Returns:
        dict: The tournament schedule data in JSON format.
    """


    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/team-of-the-week/rounds"
    session = requests.Session()
    session.get("https://www.sofascore.com")
    response = session.get(url)
    
    if response.status_code == 200:
        with open("tournament_data.json", "w") as file:
            file.write(json.dumps(response.json(), indent=4))
        print("Data saved to tournament_data.json")
        return response.json()
    else:
        print("Request failed with status code:", response.status_code)
        return None

def get_tournament_videos(tournement_id) :
    """
    Fetches videos for a given tournament ID from the SofaScore API.
    Args:
        tournement_id (str): The ID of the tournament to fetch videos for.      
    
    Returns:
        dict: The JSON response from the API containing video data.
    """


    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournement_id}/media"
    session = requests.Session()
    session.get("https://www.sofascore.com")
    response = session.get(url)
    
    if response.status_code == 200:
        with open("tournament_videos.json", "w") as file:
            file.write(json.dumps(response.json(), indent=4))
        print("Data saved to tournament_videos.json")
        return response.json()
    else:
        print("Request failed with status code:", response.status_code)
        return None

def get_team_events(tournament_id, season_id):
    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/team-events/total"


    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",

        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _gid=GA1.2.848260054.1746704814; _sharedID=33e6ba26-af4c-49fb-b08c-edb85ac456c6; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=z160Z182NHREYVVsZ3Y1SiUyRnIwdlBOZnRYTVhiaG4xcHAwM3BBTDNPJTJGbUVGR21tMEdTSGpxYWdqV0dVWEhwcXRaU1hHSkV2a0xwRXZzamZiRXZTU2dPbmpxYnFRZkZHb3pFTlBpMnVZTjYzZVpnOUUlM0Q; _ga=GA1.1.2057756329.1746703005; exco-uid=s1doc7gv5zl2c54s; pbjs-unifiedid=%7B%22TDID%22%3A%2259f6c2fa-6291-4757-a5b4-7090ca0fe0aa%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-08T12%3A47%3A18%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; FCNEC=%5B%5B%22AKsRol9OezXa5Fpj_hJpooacIrsbDv24Eh8GRPhOZzpz_TroahIYyeLnck_ZcA1nrnQuaTHPKK_HJ0jROYlfeVAOb0pGlsEgPAVThFAZdPDwWUWSytNam1vm_KsKdSZDdgpoLRejFcoOA5Gg-saZ07wopunuAqDX5Q%3D%3D%22%5D%5D; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746710719:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746710719:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746710719:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; cto_bundle=NpZd4V9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpSUFZYenlTRmw1JTJCekUyTEEyWGJxZ0VJdUhtd0dkVHk1dlFVRDJyUmhra1RkOEdzQnBPb3FVQzRPd1ZHaENkMzMlMkZtWkNpNTUzd25pU2Z5dkp6d1UyVG5PaUFzanB4M3N1aXdBRFlUdUYlMkJoeU1yeXNoRTEweCUyRjd1SVBiSmNneDBnJTNEJTNE; _awl=2.1746710722.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; _ga_FVWZ0RM4DH=GS2.1.s1746710828$o2$g0$t1746710828$j60$l0$h0; _ga_HNQ9P9MGZR=GS2.1.s1746703005$o1$g1$t1746710828$j14$l0$h0"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    with open(f"team_events_{tournament_id}_{season_id}.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
    print(f"team_events_{tournament_id}_{season_id}.json")

def get_tournament_standing(tournament_id, season_id):
    """
    Fetches the standings for a given tournament and season ID from SofaScore API via nodriver.
    """
    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/standings/total"

    # fetch JSON via browser automation
    raw = fetch_json_via_nodriver(url)
    try:
        data = json.loads(raw)
        return data
    except Exception as e:
        print(f"Error parsing tournament standings: {e}")
        return None

def get_team_of_the_week(tournament_id, season_id):
    """
    Fetches the team of the week for a given tournament and season ID from SofaScore API.
    Args:
        tournament_id (int): The ID of the tournament.
        season_id (int): The ID of the season.
    Returns:
        dict: The team of the week data in JSON format.
    """

    # URL for the SofaScore API endpoint
    # Example url: https://www.sofascore.com/api/v1/unique-tournament/679/season/61645/team-of-the-week/rounds
    # Example tournament id: 679
    # Example season id: 61645


    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/team-of-the-week/rounds"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _gid=GA1.2.848260054.1746704814; _sharedID=33e6ba26-af4c-49fb-b08c-edb85ac456c6; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=z160Z182NHREYVVsZ3Y1SiUyRnIwdlBOZnRYTVhiaG4xcHAwM3BBTDNPJTJGbUVGR21tMEdTSGpxYWdqV0dVWEhwcXRaU1hHSkV2a0xwRXZzamZiRXZTU2dPbmpxYnFRZkZHb3pFTlBpMnVZTjYzZVpnOUUlM0Q; _ga=GA1.1.2057756329.1746703005; exco-uid=s1doc7gv5zl2c54s; pbjs-unifiedid=%7B%22TDID%22%3A%2259f6c2fa-6291-4757-a5b4-7090ca0fe0aa%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-08T12%3A47%3A18%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; FCNEC=%5B%5B%22AKsRol9OezXa5Fpj_hJpooacIrsbDv24Eh8GRPhOZzpz_TroahIYyeLnck_ZcA1nrnQuaTHPKK_HJ0jROYlfeVAOb0pGlsEgPAVThFAZdPDwWUWSytNam1vm_KsKdSZDdgpoLRejFcoOA5Gg-saZ07wopunuAqDX5Q%3D%3D%22%5D%5D; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746710719:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746710719:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746710719:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; cto_bundle=NpZd4V9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpSUFZYenlTRmw1JTJCekUyTEEyWGJxZ0VJdUhtd0dkVHk1dlFVRDJyUmhra1RkOEdzQnBPb3FVQzRPd1ZHaENkMzMlMkZtWkNpNTUzd25pU2Z5dkp6d1UyVG5PaUFzanB4M3N1aXdBRFlUdUYlMkJoeU1yeXNoRTEweCUyRjd1SVBiSmNneDBnJTNEJTNE; _awl=2.1746710722.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; _ga_FVWZ0RM4DH=GS2.1.s1746710828$o2$g0$t1746710828$j60$l0$h0; _ga_HNQ9P9MGZR=GS2.1.s1746703005$o1$g1$t1746710828$j14$l0$h0"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    with open(f"team_of_the_week_{tournament_id}_{season_id}.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
    print("Data saved to team_of_the_week.json")
    return response.json()

def get_fan_ranking(season_id):
    """
    Fetches the fan ranking data from the SofaScore API.
    Returns:
        dict: The fan ranking data in JSON format.
    """

    # URL for the SofaScore API endpoint
    # Example url: https://www.sofascore.com/api/v1/event/fan-rating/ranking/season/61645
    # Example season id: 61645
    # Example tournament id: 679    
    url = f"https://www.sofascore.com/api/v1/event/fan-rating/ranking/season/{season_id}"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _awl=2.1746703011.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; FCNEC=%5B%5B%22AKsRol8eDdBx-NbJc7j-eSjFRWou6O3tyaW44G5Js11tNgt4KbE7pmKnoTWrxAPDYDgHc0lg38L16q-1mPLigvKrlh4skSYnshWbw2CrHfQpbGD9ytMAsm0FdrIeZjGPq0PAN4E1rzA06oJGX6UW3vFGE8Bmd5B0Pw%3D%3D%22%5D%5D; cto_bundle=tEB5ll9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpxOHB4c3V0ayUyQlhEWjhCME8lMkJJV3V5WUlEdmJKS0ZpSzZJZGx1d09tMWdPMk94SExOTkc0RkRBdDltcmtEcnlXWHBQUlBiVDJPaEY3WUFLa2dOQjNYd3doMTlSZDJXemV5aVZhYmM1dElIUUxIalJBdDFFZTBIczN6aGhBcGU0VHclM0QlM0Q"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    with open(f"fan_ranking_{season_id}.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
    print("Data saved to fan_ranking.json")
    return response.json()

def get_player_statistics(tournament_id, season_id):
    """
    Fetches player statistics for a given tournament and season ID from SofaScore API.
    Args:
        tournament_id (int): The ID of the tournament.
        season_id (int): The ID of the season.
    Returns:
        dict: The player statistics data in JSON format.
    """

    # URL for the SofaScore API endpoint
    # Example url: https://www.sofascore.com/api/v1/unique-tournament/679/season/61645/player-statistics/types
    # Example tournament id: 679
    # Example season id: 61645
    # Example player id: 1234567

    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/player-statistics/types"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _awl=2.1746703011.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; FCNEC=%5B%5B%22AKsRol8eDdBx-NbJc7j-eSjFRWou6O3tyaW44G5Js11tNgt4KbE7pmKnoTWrxAPDYDgHc0lg38L16q-1mPLigvKrlh4skSYnshWbw2CrHfQpbGD9ytMAsm0FdrIeZjGPq0PAN4E1rzA06oJGX6UW3vFGE8Bmd5B0Pw%3D%3D%22%5D%5D; cto_bundle=tEB5ll9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpxOHB4c3V0ayUyQlhEWjhCME8lMkJJV3V5WUlEdmJKS0ZpSzZJZGx1d09tMWdPMk94SExOTkc0RkRBdDltcmtEcnlXWHBQUlBiVDJPaEY3WUFLa2dOQjNYd3doMTlSZDJXemV5aVZhYmM1dElIUUxIalJBdDFFZTBIczN6aGhBcGU0VHclM0QlM0Q"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    with open(f"team_statistics_{tournament_id}_{season_id}.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
    print(f"Data saved to team_statistics.json")
    return response.json()
    
def get_event_details(event_id):
    """
    Fetches event details from the SofaScore API and extracts important match information along with all IDs.
    Args:
        event_id (int): The ID of the event to fetch.
    Returns:
        dict: A dictionary containing the important match information and all relevant IDs.
    """
    import datetime

    url = f"https://www.sofascore.com/api/v1/event/{event_id}"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _gid=GA1.2.848260054.1746704814; _sharedID=33e6ba26-af4c-49fb-b08c-edb85ac456c6; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=z160Z182NHREYVVsZ3Y1SiUyRnIwdlBOZnRYTVhiaG4xcHAwM3BBTDNPJTJGbUVGR21tMEdTSGpxYWdqV0dVWEhwcXRaU1hHSkV2a0xwRXZzamZiRXZTU2dPbmpxYnFRZkZHb3pFTlBpMnVZTjYzZVpnOUUlM0Q; _ga=GA1.1.2057756329.1746703005; exco-uid=s1doc7gv5zl2c54s; pbjs-unifiedid=%7B%22TDID%22%3A%2259f6c2fa-6291-4757-a5b4-7090ca0fe0aa%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-08T12%3A47%3A18%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; FCNEC=%5B%5B%22AKsRol9OezXa5Fpj_hJpooacIrsbDv24Eh8GRPhOZzpz_TroahIYyeLnck_ZcA1nrnQuaTHPKK_HJ0jROYlfeVAOb0pGlsEgPAVThFAZdPDwWUWSytNam1vm_KsKdSZDdgpoLRejFcoOA5Gg-saZ07wopunuAqDX5Q%3D%3D%22%5D%5D; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746710719:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746710719:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746710719:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; cto_bundle=NpZd4V9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpSUFZYenlTRmw1JTJCekUyTEEyWGJxZ0VJdUhtd0dkVHk1dlFVRDJyUmhra1RkOEdzQnBPb3FVQzRPd1ZHaENkMzMlMkZtWkNpNTUzd25pU2Z5dkp6d1UyVG5PaUFzanB4M3N1aXdBRFlUdUYlMkJoeU1yeXNoRTEweCUyRjd1SVBiSmNneDBnJTNEJTNE; _awl=2.1746710722.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; _ga_FVWZ0RM4DH=GS2.1.s1746710828$o2$g0$t1746710828$j60$l0$h0; _ga_HNQ9P9MGZR=GS2.1.s1746703005$o1$g1$t1746710828$j14$l0$h0"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    
    if response.status_code == 200:
        match_info = response.json()
        out_path = f"match_info_{event_id}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(match_info, indent=4, ensure_ascii=False))
        print(f"Match information saved to {out_path}")
        return match_info
    else:
        print(f"Error: {response.status_code}")
        return None

def get_lineups(event_id):
    """
    Fetches event details from the SofaScore API and extracts important match information for blog posts.
    Args:
        event_id (int): The ID of the event to fetch.
    Returns:
        dict: A dictionary containing the important match information for blog posts.
    """
    import requests
    import json

    url = f"https://www.sofascore.com/api/v1/event/{event_id}/lineups"

    headers = {
        "host": "www.sofascore.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "referer": "https://www.sofascore.com/"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        # Extract valuable information
        blog_info = {
            "confirmed": data.get("confirmed", False),
            "home_team": {
                "formation": data["home"].get("formation", "Unknown"),
                "starting_eleven": [],
                "substitutes": []
            },
            "away_team": {
                "formation": data["away"].get("formation", "Unknown"),
                "starting_eleven": [],
                "substitutes": []
            }
        }
        
        # Process home team players
        for player in data["home"].get("players", []):
            player_info = {
                "name": player["player"].get("name"),
                "position": player["player"].get("position"),
                "shirt_number": player.get("shirtNumber"),
                "country": player["player"].get("country", {}).get("name"),
                "player_id": player["player"].get("id")  # Added player ID
            }
            
            if player.get("substitute", False):
                blog_info["home_team"]["substitutes"].append(player_info)
            else:
                blog_info["home_team"]["starting_eleven"].append(player_info)
        
        # Process away team players
        for player in data["away"].get("players", []):
            player_info = {
                "name": player["player"].get("name"),
                "position": player["player"].get("position"),
                "shirt_number": player.get("shirtNumber"),
                "country": player["player"].get("country", {}).get("name"),
                "player_id": player["player"].get("id")  # Added player ID
            }
            
            if player.get("substitute", False):
                blog_info["away_team"]["substitutes"].append(player_info)
            else:
                blog_info["away_team"]["starting_eleven"].append(player_info)
        
        #with open(f"blog_lineup_{event_id}.json", "w", encoding="utf-8") as f:
            #f.write(json.dumps(blog_info, indent=4, ensure_ascii=False))
        #print(f"Blog-ready lineup saved as blog_lineup_{event_id}.json")
        return blog_info
    else:
        print("Request failed with status code:", response.status_code)
        return None

def get_player_transfer_history(player_id):

    url = f"https://www.sofascore.com/api/v1/player/{player_id}/transfer-history"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "5942b3223cf3442b85e349d5219dbd02-a95c0fa5bd504435",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "3bc656",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=unyCLV-APips1pu4To7z7,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=5942b3223cf3442b85e349d5219dbd02",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=32c9742ec4e3b0e8b118dd503f59e87; panoramaId_expiry=1747653288114; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=41f8zps11ypivbwwqsgn5c; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001747048495-R307DM9D-43DX; _gid=GA1.2.325317686.1747048502; _sharedID=42265568-a310-4c55-9a66-5fecda216214; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=i8UMYV9ZNjJQTHB6alAyY3BLb2tvNmlObElPSHpMNkloZjZOY1lCR1N0NHhYbTFHbFFET3FEU3hyaGdESExJSFBta2IlMkZSS05pdSUyQnk5VjduN3h0d2JRTW10aEhDJTJCQktFRGplRDBXTnROd2EzaUFLcyUzRA; logglytrackingsession=d57aec08-aad5-4d64-853d-b6166957b77c; _pbjs_userid_consent_data=3524755945110770; _li_dcdm_c=.sofascore.com; _lc2_fpi=a78faec1e09d--01jv23ernn2rwjcm2y1megrqmz; _lc2_fpi_js=a78faec1e09d--01jv23ernn2rwjcm2y1megrqmz; _li_ss=CgA; _ga_FVWZ0RM4DH=GS2.1.s1747050298$o1$g0$t1747050298$j60$l0$h0; _ga=GA1.1.90902502.1747048492; pbjs-unifiedid=%7B%22TDID%22%3A%22fb8d29c9-61ab-41a2-aae7-c1c15e585fea%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-12T12%3A49%3A09%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; _awl=2.1747058346.5-fb10ebcb950baa64af071846ac56fc8d-6763652d75732d63656e7472616c31-0; FCNEC=%5B%5B%22AKsRol94UWR8PRcs54SaW9IwouUUxoKC0rfvwKZDz92S1pIvnp2IGXV_YngZXOhiqDqojLPHQ16b7e4yCCqOe9_Oja9CHUKcLqM3E4pDxxF-N66Zw7LIT_PYHpTBUS0FEWDSsw87Nhbm92XUnBLA4sO__lRriEVfeA%3D%3D%22%5D%5D; cto_bundle=vCqvOV96Y0NjZHlDaUdNYjd2ZVVJWDRITnJROWpQTHF1cDV5OGl6cGhCY1l5YyUyRk5qYW8lMkJEMW8walRFTFQzSnd1SVZGUE12M0MlMkJTNlBVSlR5RGFxTDc0Y1plWTZmYWwwMnJheTNtU2pvYUNQQjR6ME1mc0daejQlMkZHOGxQVk1iUW9FJTJCWk1jRUpnTlJSTFg2NnN5YnRyZ280Wjl3JTNEJTNE; __gads=ID=eb618f494fb952a3:T=1747048491:RT=1747058675:S=ALNI_MbMzHhb7UjbFrbdo3EaCI0zPNow5g; __gpi=UID=000010b1c84ba88c:T=1747048491:RT=1747058675:S=ALNI_MbYa4l2QyuO7y9n4pKJeC2DPcPGmQ; __eoi=ID=1ced9e9b25863431:T=1747048491:RT=1747058675:S=AA-AfjbfdlKYCK5x23e09usynoCH; _ga_HNQ9P9MGZR=GS2.1.s1747058344$o5$g1$t1747058685$j34$l0$h0"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    if response.status_code == 200:
        #with open(f"player_statistics_{tournament_id}_{season_id}.json", "w", encoding="utf-8") as f:
            #f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        #print("Data saved to player_statistics.json")
        return response.json()
    else:
        print("Request failed with status code:", response.status_code)
        return None
    
def get_team_statistics(tournament_id, season_id):
    """
    Fetches player statistics for a given tournament and season ID from SofaScore API.
    Args:
        tournament_id (int): The ID of the tournament.
        season_id (int): The ID of the season.
    Returns:
        dict: The player statistics data in JSON format.
    """

    # URL for the SofaScore API endpoint
    # Example url: https://www.sofascore.com/api/v1/unique-tournament/679/season/61645/player-statistics/types
    # Example tournament id: 679
    # Example season id: 61645
    # Example player id: 1234567

    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/season/{season_id}/team-statistics/types"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _gid=GA1.2.848260054.1746704814; _sharedID=33e6ba26-af4c-49fb-b08c-edb85ac456c6; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=z160Z182NHREYVVsZ3Y1SiUyRnIwdlBOZnRYTVhiaG4xcHAwM3BBTDNPJTJGbUVGR21tMEdTSGpxYWdqV0dVWEhwcXRaU1hHSkV2a0xwRXZzamZiRXZTU2dPbmpxYnFRZkZHb3pFTlBpMnVZTjYzZVpnOUUlM0Q; _ga=GA1.1.2057756329.1746703005; exco-uid=s1doc7gv5zl2c54s; pbjs-unifiedid=%7B%22TDID%22%3A%2259f6c2fa-6291-4757-a5b4-7090ca0fe0aa%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-08T12%3A47%3A18%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; FCNEC=%5B%5B%22AKsRol9OezXa5Fpj_hJpooacIrsbDv24Eh8GRPhOZzpz_TroahIYyeLnck_ZcA1nrnQuaTHPKK_HJ0jROYlfeVAOb0pGlsEgPAVThFAZdPDwWUWSytNam1vm_KsKdSZDdgpoLRejFcoOA5Gg-saZ07wopunuAqDX5Q%3D%3D%22%5D%5D; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746710719:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746710719:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746710719:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; cto_bundle=NpZd4V9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpSUFZYenlTRmw1JTJCekUyTEEyWGJxZ0VJdUhtd0dkVHk1dlFVRDJyUmhra1RkOEdzQnBPb3FVQzRPd1ZHaENkMzMlMkZtWkNpNTUzd25pU2Z5dkp6d1UyVG5PaUFzanB4M3N1aXdBRFlUdUYlMkJoeU1yeXNoRTEweCUyRjd1SVBiSmNneDBnJTNEJTNE; _awl=2.1746710722.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; _ga_FVWZ0RM4DH=GS2.1.s1746710828$o2$g0$t1746710828$j60$l0$h0; _ga_HNQ9P9MGZR=GS2.1.s1746703005$o1$g1$t1746710828$j14$l0$h0"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    if response.status_code == 200:
        with open(f"player_statistics_{tournament_id}_{season_id}.json", "w", encoding="utf-8") as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        print("Data saved to player_statistics.json")
        return response.json()
    else:
        print("Request failed with status code:", response.status_code)
        return None
    
def get_event_details(event_id):
    """
    Fetches event details from the SofaScore API and extracts important match information along with all IDs.
    Args:
        event_id (int): The ID of the event to fetch.
    Returns:
        dict: A dictionary containing the important match information and all relevant IDs.
    """
    import datetime

    url = f"https://www.sofascore.com/api/v1/event/{event_id}"

    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "sentry-trace": "9181252d283577d20c7e536b6cff5e91-b36600782f2dabeb",
        "sec-ch-ua-platform": "\"Windows\"",
        "x-requested-with": "5e7360",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "baggage": "sentry-environment=production,sentry-release=JY4zlZh5uBuMgSvTjP4_o,sentry-public_key=d693747a6bb242d9bb9cf7069fb57988,sentry-trace_id=9181252d283577d20c7e536b6cff5e91",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/tournament/football/europe/uefa-europa-league/679",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cookie": "_cc_id=76e58d2880df6169efbc512088779985; panoramaId_expiry=1747307800798; panoramaId=627304ab36ea29f217b435f67da9185ca02c8a98be6bae5222c29a333750b99c; panoramaIdType=panoDevice; _lr_env_src_ats=false; gc_session_id=u9zxdyv4cc0cwew46w5gi; gcid_first=85a32389-b6d0-4029-8f66-d935194e0dc6; _au_1d=AU1D-0100-001746703007-WR8GT9UD-U340; _pbjs_userid_consent_data=3524755945110770; _gid=GA1.2.848260054.1746704814; _sharedID=33e6ba26-af4c-49fb-b08c-edb85ac456c6; _lr_geo_location=US; _lr_geo_location_state=KS; _sharedID_cst=VyxHLMwsHQ%3D%3D; cto_bidid=z160Z182NHREYVVsZ3Y1SiUyRnIwdlBOZnRYTVhiaG4xcHAwM3BBTDNPJTJGbUVGR21tMEdTSGpxYWdqV0dVWEhwcXRaU1hHSkV2a0xwRXZzamZiRXZTU2dPbmpxYnFRZkZHb3pFTlBpMnVZTjYzZVpnOUUlM0Q; _ga=GA1.1.2057756329.1746703005; exco-uid=s1doc7gv5zl2c54s; pbjs-unifiedid=%7B%22TDID%22%3A%2259f6c2fa-6291-4757-a5b4-7090ca0fe0aa%22%2C%22TDID_LOOKUP%22%3A%22TRUE%22%2C%22TDID_CREATED_AT%22%3A%222025-04-08T12%3A47%3A18%22%7D; pbjs-unifiedid_cst=yyzLLLEsNg%3D%3D; _lr_retry_request=true; FCNEC=%5B%5B%22AKsRol9OezXa5Fpj_hJpooacIrsbDv24Eh8GRPhOZzpz_TroahIYyeLnck_ZcA1nrnQuaTHPKK_HJ0jROYlfeVAOb0pGlsEgPAVThFAZdPDwWUWSytNam1vm_KsKdSZDdgpoLRejFcoOA5Gg-saZ07wopunuAqDX5Q%3D%3D%22%5D%5D; __gads=ID=c547b4a13f2f753f:T=1746703003:RT=1746710719:S=ALNI_MbNUkKXtNi606HB7_aO4e-fi1-TXA; __gpi=UID=000010af9ed8a6df:T=1746703003:RT=1746710719:S=ALNI_Mb5rpDAojxqVcqko0EGRwwTgDjNJw; __eoi=ID=b326749d02c657b5:T=1746703003:RT=1746710719:S=AA-AfjaFDydqBMCctGgCnzv_LZ8S; cto_bundle=NpZd4V9PZ1MlMkZmRTVHQTN3cGlVQUYyZmdWYmpSUFZYenlTRmw1JTJCekUyTEEyWGJxZ0VJdUhtd0dkVHk1dlFVRDJyUmhra1RkOEdzQnBPb3FVQzRPd1ZHaENkMzMlMkZtWkNpNTUzd25pU2Z5dkp6d1UyVG5PaUFzanB4M3N1aXdBRFlUdUYlMkJoeU1yeXNoRTEweCUyRjd1SVBiSmNneDBnJTNEJTNE; _awl=2.1746710722.5-8c7a02360a1c07ad76e2e89d22217448-6763652d75732d63656e7472616c31-0; _ga_FVWZ0RM4DH=GS2.1.s1746710828$o2$g0$t1746710828$j60$l0$h0; _ga_HNQ9P9MGZR=GS2.1.s1746703005$o1$g1$t1746710828$j14$l0$h0"
    }

    session = requests.Session()
    session.headers.update(headers)
    session.get("https://www.sofascore.com/")
    response = session.get(url)
    
    if response.status_code == 200:
        match_info = response.json()
        out_path = f"match_info_{event_id}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(match_info, indent=4, ensure_ascii=False))
        print(f"Match information saved to {out_path}")
        return match_info
    else:
        print(f"Error: {response.status_code}")
        return None


def get_player(player_id):
    """
    Fetches player details for a given player ID from SofaScore API.
    """
    url = f"https://www.sofascore.com/api/v1/player/{player_id}"
    
    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.sofascore.com/",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        with open(f"player_{player_id}.json", "w", encoding="utf-8") as f:
            f.write(json.dumps(response.json(), indent=4, ensure_ascii=False))
        return response.json()
    else:
        print(f"Error fetching player {player_id}: {response.status_code}")
        return None

def get_team(team_id):
    """
    Fetches team details for a given team ID from SofaScore API.
    """
    url = f"https://www.sofascore.com/api/v1/team/{team_id}"
    
    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "referer": "https://www.sofascore.com/"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching team {team_id}: {response.status_code}")
        return None

def get_team_players(team_id):
    """
    Fetches team players (squad) for a given team ID.
    """
    url = f"https://www.sofascore.com/api/v1/team/{team_id}/players"
    
    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "referer": "https://www.sofascore.com/"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching players for team {team_id}: {response.status_code}")
        return None

def get_event_h2h(event_id):
    """
    Fetches H2H data for an event.
    """
    url = f"https://www.sofascore.com/api/v1/event/{event_id}/h2h"
    
    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "referer": "https://www.sofascore.com/"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching H2H for event {event_id}: {response.status_code}")
        return None

def get_event_incidents(event_id):
    """
    Fetches incidents for an event.
    """
    url = f"https://www.sofascore.com/api/v1/event/{event_id}/incidents"
    
    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "referer": "https://www.sofascore.com/"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching incidents for event {event_id}: {response.status_code}")
        return None

def search(query):
    """
    Searches for entities.
    """
    url = "https://www.sofascore.com/api/v1/search/all"
    params = {"q": query}
    
    headers = {
        "host": "www.sofascore.com",
        "connection": "keep-alive",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "accept": "*/*",
        "referer": "https://www.sofascore.com/"
    }

    session = requests.Session()
    session.headers.update(headers)
    response = session.get(url, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error searching for {query}: {response.status_code}")
        return None

def get_tournament_details(tournament_id):
    """
    Fetches detailed information about a unique tournament.
    """
    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}"
    
    # fetch JSON via browser automation
    raw = fetch_json_via_nodriver(url)
    try:
        data = json.loads(raw)
        return data
    except Exception as e:
        print(f"Error parsing tournament details: {e}")
        return None

def get_tournament_seasons(tournament_id):
    """
    Fetches available seasons for a unique tournament.
    """
    url = f"https://www.sofascore.com/api/v1/unique-tournament/{tournament_id}/seasons"
    
    # fetch JSON via browser automation
    raw = fetch_json_via_nodriver(url)
    try:
        data = json.loads(raw)
        return data
    except Exception as e:
        print(f"Error parsing tournament seasons: {e}")
        return None
