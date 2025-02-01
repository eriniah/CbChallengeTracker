"""
Strip the data from 'https://jsp.ellpeck.de/#03120789' and format it into a usable JSON format
"""
import requests
import re
import json

URL_PAGE_FORMAT = "https://jsp.ellpeck.de/#{}"
URL_DATA_FORMAT = "https://jsp.ellpeck.de/share.php?id={}"
HOME_ID = "03120789"

def print_response(response):
    print(response.status_code)
    print(response.headers)
    print(response.text)

def get_ids_from_home():
    """
    Request data from the home page to gather the season subpage ids
    :return: list of str subpage ids
    """
    response = requests.get(URL_DATA_FORMAT.format(HOME_ID))
    # print_response(response)

    if response.status_code is not 200:
        raise Exception(f"Bad response: {response.status_code}")

    x = re.findall(r"#([a-f0-9]+)", response.text)

    return x

def season_from_str(str_season):
    token = re.match(r"\s*#\s+Conqueror's Blade Unit Challenge (?P<name>[\w -]+)", str_season)
    name = token.group("name")
    season_id = int(re.search(r"(?P<id>\d+)", name).group('id'))
    return {
        "id": season_id,
        "name": name,
        "sections": []
    }

def section_from_str(season, section_idx, str_section):
    token = re.match(r"\s*##\s+(?P<name>.*)", str_section)
    return {
        "id": f"{season['id']}.{section_idx}",
        "name": token.group('name'),
        "stages": []
    }

def stage_from_str(season, stage_idx, str_stage):
    token = re.match(r"\s*####\s+(?P<name>Stage \d+)\s+\((?P<required>\d+)/(?P<total>\d+)\s+Required\)", str_stage)

    return {
        "id": f"{season['sections'][-1]['id']}.{stage_idx}",
        "name": token.group('name'),
        "required": int(token.group('required')),
        "total": int(token.group('total')),
        "challenges": [],
        "rewards": []
    }

def challenge_from_str(season, challenge_idx, str_challenge):
    token = re.match(r"\s*-\s+\[\s+]\s+(?P<text>.*)", str_challenge)
    text = token.group('text')

    tokens = [
      # Name, Regex, Tags
      ('Siege', r"Siege", ["Siege", "Field"]),
      ('Field', r"Field", ["Siege", "Field"]),
      ('PvP', r"PvP", ["Siege", "Field", "Free Battles"]),
      ('AnyMode', r"in any mode", ["Siege", "Field", "Free Battles"]),
      ('AnyBattle', r"in any battle", ["Siege", "Field", "Free Battles"]),
      ('SingleBattle', r"in a single battle", ["Siege", "Field", "Free Battles"]),
      ('PVE', r"PVE", ["Bandit Raid", "Expedition"]),
      ('BanditRaid', r"Raider Camp|Bandit Raid", ["Bandit Raid"]),
      ('Expedition', r"Expedition", ["Bandit Raid", "Expedition"]),
      ('Rebels', r"Rebel", ["Open World"]),
      ('LootSites', r"loot site", ["Open World"]),
      ('FiefQuests', r"Fief Quest", ["Open World"]),
      ('TerritoryWars', r"Territory\s*War", ["Territory Wars"]),
      ('Ranked', r"Ranked", ["Ranked"]),
      ('FreeBattles', r"Free Battle", ["Siege", "Field"]),
      ('Deathmatch', r"Deathmatch", ["Deathmatch"]),
      ('Levels', r"(Hero|Season).*level", ["General"]),
      ('Badges', r"^Earn\s+\d+/\d+(\s+silver (quality )?or better)?\s+badges(\.)?$", ["General"]),
      ('PvpBadge', r"(Deadly Century|Hat Trick|Shatter the Ranks|No Quarter|Grand Bloodbath|Drop Dead|Combo Breaker).*(badge|times)", ["Siege", "Field", "Free Battles"]),
      ('PveBadge', r"(Get|Earn).*(Cakewalk).*badge", ["Siege", "Field", "Free Battles"]),
      ('IntoBattle', r"Take.*into.*battle", ["Siege", "Field", "Free Battles"]),
      ('Artillery', r"(Destroy|Deploy|Use).*artillery", ["Siege", "Field", "Free Battles"]),
      ('Ladders', r"Kick over.*ladders", ["Siege", "Free Battles"]),
      ('Treb', r"trebuchet", ["Siege", "Free Battles"]),
      ('kd', r"kill/death ratio", ["Siege", "Field", "Free Battles"]),
      ('UnitKills', r"kill.*soldiers using", ["Siege", "Field", "Free Battles"]),
      ('tks', r"Troop Kill Score", ["Siege", "Field", "Free Battles"]),
      ('DailyQuests', r"Daily Quests", ["General"]),
      ('240kills', r"You or your group.*(240 soldiers|8 heroes)", ["Siege", "Field", "Free Battles"]),
    ]
    # tokens_regex = '|'.join('(?P<%s>%s)' % pair for pair in map(lambda t: (t[0], t[1]), tokens))

    tags = set()
    for tok in tokens:
      match = re.search(tok[1], text, re.RegexFlag.I)
      if match is not None:
        for tag in tok[2]:
          tags.add(tag)

    return {
        "id": f"{season['sections'][-1]['stages'][-1]['id']}.{challenge_idx}",
        "text": text,
        "tags": list(tags),
        "conditions": []
    }

def reward_from_str(str_reward):
    token = re.match(r"\s*-\s+((?P<amount>\d+)\s+(x\s+)?)?(?P<text>[\w -\"',/\\]*)", str_reward)
    amount = token.group('amount')
    return {
        "text": token.group('text'),
        "amount": int(amount) if amount else None
    }

def get_season_dict(season_id):
    """
    Request data from a season page. Extract challenges
    :return: list of str subpage ids
    """
    response = requests.get(URL_DATA_FORMAT.format(season_id))
    print_response(response)

    if response.status_code is not 200:
        raise Exception(f"Bad response: {response.status_code}")

    tokens = [
        ('REWARDS', r"#####\s+Reward\s*\n"),
        ('STAGE', r"####\s+Stage\s+\d+\s+\(\d+/\d+\s+Required\)\s*\n"),
        ('SECTION', r"##\s+([^\n]+)\s*\n"),
        ('SEASON', r"#\s+([^\n]+)\s*\n"),
        ('REWARD', r"-\s+[a-zA-Z0-9 ,.\"'/\\\(\)\.]+\s*\n"),
        ('CHALLENGE', r"-\s+\[\s*\]\s+([^\n]+)\s*\n"),
    ]
    tokens_regex = '|'.join('(?P<%s>%s)' % pair for pair in tokens)

    season = None
    section_idx = 1
    stage_idx = 1
    challenge_idx = 1
    for token in re.finditer(tokens_regex, response.text):
        kind = token.lastgroup
        value = token.group().strip()
        print(f"Token ({kind}): {value}")

        if kind == 'SEASON':
            season = season_from_str(value)
            section_idx = 1
        elif kind == 'SECTION':
            season['sections'].append(section_from_str(season, section_idx, value))
            section_idx += 1
            stage_idx = 1
        elif kind == 'STAGE':
            season['sections'][-1]['stages'].append(stage_from_str(season, stage_idx, value))
            stage_idx += 1
            challenge_idx = 1
        elif kind == 'CHALLENGE':
            season['sections'][-1]['stages'][-1]['challenges'].append(challenge_from_str(season, challenge_idx, value))
            challenge_idx += 1
        elif kind == 'REWARD':
            season['sections'][-1]['stages'][-1]['rewards'].append(reward_from_str(value))

    return season

if __name__ == "__main__":
    ids = get_ids_from_home()
    print(f"Found season ids: {str(ids)}")

    seasons_dict = []
    for season_id in ids:
        season_dict = get_season_dict(season_id)
        seasons_dict.append(season_dict)

    with open('./challenges.json', 'w') as output:
        json.dump(seasons_dict, output, indent=4)
